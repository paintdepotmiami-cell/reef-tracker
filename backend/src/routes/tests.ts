import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const testsRouter = Router();

// Get all water tests (newest first)
testsRouter.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_water_tests')
    .select('*')
    .order('test_date', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get latest test
testsRouter.get('/latest', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('reef_water_tests')
    .select('*')
    .order('test_date', { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Generate recommendations based on values
  const recs = generateRecommendations(data);
  res.json({ test: data, recommendations: recs });
});

// Create new test
testsRouter.post('/', async (req: Request, res: Response) => {
  const { test_date, calcium, alkalinity, magnesium, ph, phosphate, nitrate, nitrite, ammonia, salinity, temperature, photo_url, notes } = req.body;

  const { data, error } = await supabase
    .from('reef_water_tests')
    .insert({ test_date, calcium, alkalinity, magnesium, ph, phosphate, nitrate, nitrite, ammonia, salinity, temperature, photo_url, notes })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

interface WaterTest {
  calcium?: number;
  alkalinity?: number;
  magnesium?: number;
  ph?: number;
  phosphate?: number;
  nitrate?: number;
  nitrite?: number;
  ammonia?: number;
}

interface Recommendation {
  param: string;
  level: 'ok' | 'warning' | 'action';
  title: string;
  text: string;
  product?: string;
}

function generateRecommendations(test: WaterTest): Recommendation[] {
  const recs: Recommendation[] = [];

  if (test.calcium !== undefined && test.calcium !== null) {
    if (test.calcium >= 380 && test.calcium <= 450) {
      recs.push({ param: 'calcium', level: 'ok', title: `Calcio: ${test.calcium} ppm`, text: 'Rango perfecto. Mantener Kalkwasser + Calcium Brightwell.', product: 'Kalkwasser (ATO) + Calcium (Brightwell)' });
    } else if (test.calcium < 380) {
      recs.push({ param: 'calcium', level: 'action', title: `Calcio Bajo: ${test.calcium} ppm`, text: 'Aumentar concentracion de Kalkwasser en ATO o aumentar dosis de Calcium Brightwell.', product: 'Kalkwasser + Calcium (Brightwell)' });
    } else {
      recs.push({ param: 'calcium', level: 'warning', title: `Calcio Alto: ${test.calcium} ppm`, text: 'Reducir dosis de Calcium. Puede causar precipitacion si Alk tambien esta alto.', product: 'Reducir Calcium (Brightwell)' });
    }
  }

  if (test.alkalinity !== undefined && test.alkalinity !== null) {
    if (test.alkalinity >= 7 && test.alkalinity <= 11) {
      recs.push({ param: 'alkalinity', level: 'ok', title: `Alkalinity: ${test.alkalinity} dKH`, text: 'Buen rango. Mantener Kalkwasser + Balance Seachem.', product: 'Kalkwasser + Balance (Seachem)' });
    } else if (test.alkalinity < 7) {
      recs.push({ param: 'alkalinity', level: 'action', title: `Alk Baja: ${test.alkalinity} dKH`, text: 'Aumentar dosis de Balance (Seachem) o Kalkwasser. Alk baja afecta crecimiento de corales.', product: 'Balance (Seachem) + Kalkwasser' });
    } else {
      recs.push({ param: 'alkalinity', level: 'warning', title: `Alk Alta: ${test.alkalinity} dKH`, text: 'Reducir dosificacion. Alk >12 puede causar tissue necrosis en SPS/LPS.', product: 'Reducir Balance (Seachem)' });
    }
  }

  if (test.ph !== undefined && test.ph !== null) {
    if (test.ph >= 8.0 && test.ph <= 8.4) {
      recs.push({ param: 'ph', level: 'ok', title: `pH: ${test.ph}`, text: 'Rango ideal. Kalkwasser y CO2 reactor hacen buen trabajo.', product: 'Kalkwasser + CO2 reactor' });
    } else if (test.ph < 8.0) {
      recs.push({ param: 'ph', level: 'action', title: `pH Bajo: ${test.ph}`, text: 'Verificar Kalkwasser en ATO (concentracion suficiente). CO2 reactor al skimmer ayuda. Asegurar ventilacion en el area.', product: 'Kalkwasser (ATO) + CO2 reactor + Balance (Seachem)' });
    } else {
      recs.push({ param: 'ph', level: 'warning', title: `pH Alto: ${test.ph}`, text: 'Reducir Kalkwasser. pH >8.5 estresa corales y peces.', product: 'Reducir Kalkwasser' });
    }
  }

  if (test.phosphate !== undefined && test.phosphate !== null) {
    if (test.phosphate <= 0.1) {
      recs.push({ param: 'phosphate', level: 'ok', title: `Fosfato: ${test.phosphate} ppm`, text: 'Buen nivel. RowaPhos y Phosphat-E funcionan bien.', product: 'RowaPhos + Phosphat-E (Fauna Marin)' });
    } else {
      recs.push({ param: 'phosphate', level: 'action', title: `Fosfato Alto: ${test.phosphate} ppm`, text: 'Cambiar RowaPhos en reactor PhosBan. Aumentar Phosphat-E temporalmente. Chaeto reactor tambien exporta PO4.', product: 'RowaPhos (reactor) + Phosphat-E (Fauna Marin)' });
    }
  }

  if (test.magnesium !== undefined && test.magnesium !== null) {
    if (test.magnesium >= 1250 && test.magnesium <= 1400) {
      recs.push({ param: 'magnesium', level: 'ok', title: `Magnesio: ${test.magnesium} ppm`, text: 'Rango perfecto.', product: 'Magnesium (Brightwell)' });
    } else if (test.magnesium > 1400) {
      recs.push({ param: 'magnesium', level: 'action', title: `Magnesio Alto: ${test.magnesium} ppm`, text: 'PAUSAR Magnesium Brightwell hasta que baje a ~1350. Cambios de agua lo bajan gradualmente.', product: 'PAUSAR Magnesium (Brightwell)' });
    } else {
      recs.push({ param: 'magnesium', level: 'action', title: `Magnesio Bajo: ${test.magnesium} ppm`, text: 'Aumentar dosis de Magnesium Brightwell. Mg bajo impide absorcion de Ca.', product: 'Magnesium (Brightwell)' });
    }
  }

  if (test.nitrate !== undefined && test.nitrate !== null) {
    if (test.nitrate >= 2 && test.nitrate <= 15) {
      recs.push({ param: 'nitrate', level: 'ok', title: `Nitrato: ${test.nitrate} ppm`, text: 'Buen nivel para mixed reef.', product: 'Mantener rutina' });
    } else if (test.nitrate < 2) {
      recs.push({ param: 'nitrate', level: 'action', title: `Nitrato Bajo: ${test.nitrate} ppm`, text: 'Demasiado bajo. Alimentar mas Reef-Roids y comida congelada. Reducir carbon o chaeto si es necesario.', product: 'Reef-Roids (Polyplab) + Restor (Brightwell)' });
    } else {
      recs.push({ param: 'nitrate', level: 'warning', title: `Nitrato Alto: ${test.nitrate} ppm`, text: 'Aumentar cambios de agua o Carbon en reactor. Verificar bioload.', product: 'Carbon reactor + cambios de agua' });
    }
  }

  if (test.ammonia !== undefined && test.ammonia !== null) {
    if (test.ammonia === 0) {
      recs.push({ param: 'ammonia', level: 'ok', title: 'Amonio: 0 ppm', text: 'Perfecto. Ciclo de nitrogeno funcionando bien.' });
    } else {
      recs.push({ param: 'ammonia', level: 'action', title: `Amonio Detectable: ${test.ammonia} ppm`, text: 'Verificar skimmer Klir (produciendo skimmate oscuro?). Carbon reactor limpio. No sobrealimentar. Posible muerte de animal no detectada.', product: 'Skimmer Klir + Carbon reactor' });
    }
  }

  if (test.nitrite !== undefined && test.nitrite !== null) {
    if (test.nitrite === 0) {
      recs.push({ param: 'nitrite', level: 'ok', title: 'Nitrito: 0 ppm', text: 'Perfecto.' });
    } else {
      recs.push({ param: 'nitrite', level: 'action', title: `Nitrito Detectable: ${test.nitrite} ppm`, text: 'Problema serio — ciclo incompleto. Cambio de agua inmediato. No alimentar hasta que baje a 0.', product: 'Cambio de agua de emergencia' });
    }
  }

  return recs;
}
