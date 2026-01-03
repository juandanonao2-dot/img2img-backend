// server.js
const express = require('express');
const multer  = require('multer');
const axios   = require('axios');
const FormData = require('form-data');
const fs      = require('fs');
const app = express();
const upload = multer({ dest: 'tmp/' });

const REPLICATE_API_TOKEN = process.env.REPLICATE_TOKEN;

app.post('/edit', upload.single('image'), async (req,res)=>{
  const { prompt } = req.body;
  const filePath = req.file.path;

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));
  const up = await axios.post('https://api.replicate/api.upload.io/v1/files', form, {
    headers: {...form.getHeaders(), Authorization:`Token ${REPLICATE_API_TOKEN}`}
  });
  const imgURL = up.data.urls.get;

  const run = await axios.post('https://api.replicate.com/v1/predictions', {
    version: "7b1d5e3589db24e1b0e0b5c1711fd2b6a6cfe6bc6d0f6f5c5c1c1c1c1c1c1c1c",
    input: {image: imgURL, prompt, num_inference_steps: 40, guidance_scale: 7.5}
  }, {headers: {Authorization:`Token ${REPLICATE_API_TOKEN}`}});

  let status; let out;
  do{
    await new Promise(r=>setTimeout(r,1500));
    const chk = await axios.get(`https://api.replicate.com/v1/predictions/${run.data.id}`, {
      headers: {Authorization:`Token ${REPLICATE_API_TOKEN}`}
    });
    status = chk.data.status;
    out = chk.data.output;
  } while(status!=="succeeded" && status!=="failed");

  fs.unlinkSync(filePath);
  status==="succeeded" ? res.json({url:out}) : res.status(500).json({error:"Falha"});
});

app.listen(process.env.PORT||3000, ()=>console.log("Rodando"));
      
