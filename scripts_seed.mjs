import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(',', '.'));
}

async function upload() {
    console.log('Uploading Tickets...');
    const tContent = fs.readFileSync('tickets_todo.csv', 'utf-8');
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

    console.log('Uploading Categories...');
    const cContent = fs.readFileSync('ventas_categorias.csv', 'utf-8');
    const categories = Papa.parse(cContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => ({
        category: row['Categoria'],
        sales: parseInt(row['Ventas']),
        total: parseCurrency(row['Total'])
    })).filter(x => x.category);
    await supabase.from('sales_categories').insert(categories);

    console.log('Uploading Products...');
    const pContent = fs.readFileSync('ventas_productos.csv', 'utf-8');
    const products = Papa.parse(pContent, { header: true, delimiter: ';', skipEmptyLines: true }).data.map(row => ({
        category: row['Categoria'],
        product: row['Producto'],
        sales: parseInt(row['Ventas']),
        total: parseCurrency(row['Total'])
    })).filter(x => x.product);
    for(let i=0; i<products.length; i+=1000) {
        const { error } = await supabase.from('sales_products').insert(products.slice(i, i+1000));
    }
    
    console.log('Done!');
}
upload().catch(console.error);
