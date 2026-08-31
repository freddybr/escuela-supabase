import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kuclhqlrzcmryrtofssg.supabase.co';
const supabaseAnonKey = 'sb_publishable_dEyNvK-cmuW2oSYDvlbZTg_-xdBzoCV';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Checking Supabase Database Status ---');
  
  const { data: profes, error: errorProfes } = await supabase
    .from('profesores')
    .select('id, profe_nombre, profe_email');
    
  if (errorProfes) {
    console.error('Error fetching profesores:', errorProfes);
  } else {
    console.log(`Profesores count: ${profes.length}`);
    console.log('Sample profesores:', profes.slice(0, 3));
  }

  const { data: alumnos, error: errorAlumnos } = await supabase
    .from('alumnos')
    .select('id, alumno_nombre, alumno_email');
    
  if (errorAlumnos) {
    console.error('Error fetching alumnos:', errorAlumnos);
  } else {
    console.log(`Alumnos count: ${alumnos.length}`);
  }

  const { data: asignaciones, error: errorAsig } = await supabase
    .from('asignaciones')
    .select('id');
    
  if (errorAsig) {
    console.error('Error fetching asignaciones:', errorAsig);
  } else {
    console.log(`Asignaciones count: ${asignaciones.length}`);
  }

  const { data: control, error: errorControl } = await supabase
    .from('control')
    .select('id');
    
  if (errorControl) {
    console.error('Error fetching control:', errorControl);
  } else {
    console.log(`Control count: ${control.length}`);
  }
}

main();
