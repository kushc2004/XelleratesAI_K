import { exec } from 'child_process';
import { join } from 'path';
import { supabase } from '@/lib/supabaseclient'; // Import your Supabase client
import { stdin } from 'process';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        // const { userId } = req.body;
        const {company_id} = req.body;
        console.log("company id in api: ", company_id)

        if (!company_id) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        try {
            // Fetch MIS file path from the backend table based on company ID
            const { data, error } = await supabase
                .from('company_documents')
                .select('mis')
                .eq('company_id', company_id)
                .single();

            console.log("Fetched data:", data);

            if (error || !data) {
                return res.status(500).json({ error: 'Failed to retrieve MIS file path' });
            }

            const misFilePath = data.mis;

            const pythonPath = "python";
            const scriptPath = `"app/(dashboard)/dashboard/finDataExtractionNew.py"`;
            const scriptPath1 = `"app/(dashboard)/dashboard/finDataExtractionNew.js"`;
            const command = `${pythonPath} ${scriptPath} ${misFilePath}`;

            const command1 = `node ${scriptPath1} ${misFilePath}`

            exec(command1, (error, stdout, stderr) => {
                console.log("Executing python file...");
                console.log("Python output: ", stdout);
                console.log("end");
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                if (stderr) {
                    return res.status(500).json({ error: stderr });
                }

                try {
                    console.log("python output trimmed: ", stdout.trim());
                    console.log("end");
                    const outputData = JSON.parse(stdout.trim());
                    res.status(200).json(outputData);
                } catch (readError) {
                    res.status(500).json({ error: 'Error reading JSON file.' });
                }
            });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
