// Todas las peticiones pasan por nuestro servidor Node (/api/...), que consulta NHTSA vPIC
async function pedir(ruta) {
  const res = await fetch(`/api/${ruta}`);
  if (!res.ok) throw new Error('Error en la API');
  return (await res.json()).Results;
}

// --- Marcas para el autocompletado ---
async function cargarMarcas() {
  try {
    const marcas = await pedir('GetMakesForVehicleType/car');
    document.getElementById('lista-marcas').innerHTML =
      marcas.map(m => `<option value="${m.MakeName}">`).join('');
  } catch {
    // el autocompletado es opcional
  }
}

// --- Modelos por marca y año ---
document.getElementById('form-modelos').addEventListener('submit', async e => {
  e.preventDefault();
  const marca = document.getElementById('marca').value.trim();
  const anio = document.getElementById('anio').value;
  const estado = document.getElementById('estado-modelos');
  const lista = document.getElementById('modelos');

  estado.textContent = 'Cargando...';
  lista.innerHTML = '';
  try {
    const modelos = await pedir(`GetModelsForMakeYear/make/${encodeURIComponent(marca)}/modelyear/${anio}`);
    estado.textContent = modelos.length
      ? `${modelos.length} modelos de ${marca.toUpperCase()} (${anio})`
      : 'No se encontraron modelos.';
    lista.innerHTML = modelos.map(m => `<li>${m.Model_Name}</li>`).join('');
  } catch (err) {
    estado.textContent = err.message;
  }
});

// --- Decodificador de VIN ---
const CAMPOS = {
  Make: 'Marca',
  Model: 'Modelo',
  ModelYear: 'Año',
  BodyClass: 'Carrocería',
  VehicleType: 'Tipo de vehículo',
  DriveType: 'Tracción',
  FuelTypePrimary: 'Combustible',
  EngineCylinders: 'Cilindros',
  DisplacementL: 'Cilindrada (L)',
  TransmissionStyle: 'Transmisión',
  Doors: 'Puertas',
  PlantCountry: 'País de fabricación',
};

document.getElementById('form-vin').addEventListener('submit', async e => {
  e.preventDefault();
  const vin = document.getElementById('vin').value.trim();
  const estado = document.getElementById('estado-vin');
  const tabla = document.getElementById('resultado-vin');

  estado.textContent = 'Consultando...';
  tabla.innerHTML = '';
  try {
    const [datos] = await pedir(`DecodeVinValues/${encodeURIComponent(vin)}`);
    const filas = Object.entries(CAMPOS).filter(([k]) => datos[k]);
    estado.textContent = filas.length ? '' : 'VIN no válido o sin datos.';
    tabla.innerHTML = filas.map(([k, nombre]) => `<tr><td>${nombre}</td><td>${datos[k]}</td></tr>`).join('');
  } catch (err) {
    estado.textContent = err.message;
  }
});

cargarMarcas();
