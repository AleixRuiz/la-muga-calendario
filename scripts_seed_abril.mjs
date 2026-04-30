import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(',', '.'));
}

const MONTH = '2026-04';

async function upload() {
    console.log('Uploading April Tickets...');
    const tContent = fs.readFileSync(path.resolve(__dirname, 'tickets abril.csv'), 'utf-8');
    const tickets = Papa.parse(tContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => ({
        serie: row['Serie'],
        ticket: parseInt(row['Ticket']),
        date: row['Fecha'] ? row['Fecha'].split('/').reverse().join('-') : null,
        time: row['Hora'],
        total: parseCurrency(row['Total'])
    })).filter(x => x.ticket);
    
    // Batch in 1000s
    for(let i=0; i<tickets.length; i+=1000) {
        const { error } = await supabase.from('sales_tickets').insert(tickets.slice(i, i+1000));
        if (error) console.error(error);
        console.log(`Inserted ${i+1000} tickets`);
    }

    console.log('Uploading April Categories...');
    const cContent = fs.readFileSync(path.resolve(__dirname, 'VC Abril.csv'), 'utf-8');
    const categories = Papa.parse(cContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => ({
        category: row['Categoria']?.replace(/"/g, ''),
        sales: parseInt(row['Ventas']),
        total: parseCurrency(row['Total']),
        month: MONTH
    })).filter(x => x.category);
    await supabase.from('sales_categories').insert(categories);

    console.log('Uploading April Products...');
    const pContent = fs.readFileSync(path.resolve(__dirname, 'VP Abril.csv'), 'utf-8');
    const products = Papa.parse(pContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => ({
        category: row['Categoria']?.replace(/"/g, '') || row['Categora']?.replace(/"/g, ''),
        product: row['Producto']?.replace(/"/g, ''),
        sales: parseInt(row['Ventas']),
        total: parseCurrency(row['Total']),
        month: MONTH
    })).filter(x => x.product);
    for(let i=0; i<products.length; i+=1000) {
        const { error } = await supabase.from('sales_products').insert(products.slice(i, i+1000));
    }

    console.log('Uploading April Catalogo...');
    try {
      const catContent = fs.readFileSync(path.resolve(__dirname, 'catalogo abril.csv'), 'utf-8');
      const catalogo = Papa.parse(catContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => {
          const category = row['Categoria']?.replace(/"/g, '') || row['Categora']?.replace(/"/g, '');
          const product = row['Producto']?.replace(/"/g, '');
          const price = parseCurrency(row['Precio']);
          return {
              product_id: row['Id']?.replace(/"/g, ''),
              category: category,
              product: product,
              price: price,
              month: MONTH
          };
      }).filter(x => x.product);

      for(let i=0; i<catalogo.length; i+=1000) {
          const { error } = await supabase.from('sales_catalogo').insert(catalogo.slice(i, i+1000));
          if(error) console.log(error);
      }
    } catch(err) {
      console.log('No catalogo imported.', err);
    }
    
    console.log('Done!');
}
upload().catch(console.error);