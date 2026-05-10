import mammoth from 'mammoth';
import fs from 'fs';

const docPath = "C:\\Users\\Hp\\Downloads\\My resource\\CRACK_JAMB_CHEMISTRY_2000Q Real .docx";
const outPath = "C:\\Users\\Hp\\Desktop\\Naija-tutor\\extracted_resource.txt";

mammoth.extractRawText({path: docPath})
    .then(function(result) {
        const text = result.value; // The raw text
        fs.writeFileSync(outPath, text);
        console.log("Extracted text saved to " + outPath);
    })
    .catch(function(err) {
        console.error(err);
    });
