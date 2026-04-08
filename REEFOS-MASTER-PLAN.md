# ReefOS Master Plan — La App Definitiva para Acuarismo Marino

## Vision
Una aplicacion que guie a un principiante desde CERO hasta mantener un reef exitoso.
Asistente virtual paso a paso, basado en principios biologicos, quimicos y tecnicos.

**Filosofia:** "La venta es secundaria. Debemos dar un servicio."

---

## Estado Actual (Abril 7, 2026)

### Infraestructura
| Componente | Estado | URL |
|---|---|---|
| Frontend (Next.js 15) | LIVE | reefos.net (Vercel) |
| Database/Auth/Storage | LIVE | Supabase (lhypodcttwhonuvumwod) |
| Backend API | LIVE | reefos-api.onrender.com |
| PWA | LIVE | Instalable en iOS/Android |
| GitHub | LIVE | paintdepotmiami-cell/reef-tracker |

### Modulos de Inteligencia (lib/)
| Motor | Archivo | Estado |
|---|---|---|
| Cycle Engine | cycle-engine.ts | COMPLETO — 7 fases del ciclo del nitrogeno |
| Trend Analysis | trend-analysis.ts | COMPLETO — drift detection, proyeccion a 7 dias |
| Dosing Calculator | dosing-calculator.ts | COMPLETO — Ca, Alk, Mg con productos especificos |
| Compatibility Engine | compatibility.ts | COMPLETO — cruza especies por agresion/requisitos |
| Flow Optimizer | flow-optimizer.ts | COMPLETO — analisis AI de bombas y flujo |
| Troubleshooter | troubleshooter.ts | COMPLETO — diagnostico de problemas |
| AI Photo Scan | /api/analyze-test | COMPLETO — GPT-4o Vision lee test kits |
| AI Recommendations | /api/recommendations | COMPLETO — recomienda productos segun perfil |

### Pantallas (app/)
| Pantalla | Ruta | Estado |
|---|---|---|
| Login + Onboarding | /login, /onboarding | COMPLETO |
| Dashboard (Home) | / | COMPLETO — hero, params, maintenance, cycle, feed |
| Water Logs + AI Scan | /logs | COMPLETO — multi-foto, AI auto-fill |
| Livestock Gallery | /livestock | COMPLETO — fish, coral, inverts con fotos |
| Equipment & Dosing | /gear | COMPLETO — 16 guias, warnings faltantes, detail sheets |
| Products (67) + AI Recs | /products | COMPLETO — catalogo, My Products, AI recommendations |
| 3D Reef Planner | /planner | COMPLETO |
| Flow Optimizer | /flow | COMPLETO |
| Dosing Calculator | /dosing | COMPLETO — Ca, Alk, Mg |
| Species Library (180+) | /library | COMPLETO |
| Articles & Guides | /articles | COMPLETO (Antigravity) |
| Wishlist + Compatibility | /wishlist | COMPLETO (Antigravity) |
| Acclimation Guide | /acclimate | COMPLETO (Antigravity) |
| Emergency SOS | /sos | COMPLETO |
| Tools Hub | /tools | COMPLETO |
| Profile | /profile | COMPLETO |

### Componentes Reutilizables
| Componente | Archivo | Funcion |
|---|---|---|
| ParamGauge | ParamGauge.tsx | Gauge visual de parametro con rango seguro |
| ParamSparkline | ParamSparkline.tsx | Mini grafica de tendencia |
| ConsumableGauge | ConsumableGauge.tsx | Barra de vida util de consumible |
| CycleStatus | CycleStatus.tsx | Card/banner de estado del ciclo |
| BottomNav | BottomNav.tsx | Navegacion inferior 5 tabs |
| TopBar | TopBar.tsx | Barra superior |
| AppShell | AppShell.tsx | Layout wrapper |
| AuthGuard | AuthGuard.tsx | Proteccion de rutas |

---

## Los 6 Modulos — Gap Analysis Detallado

### MODULO 1: Planificacion y Configuracion Inicial

**Objetivo:** Antes de comprar nada, guiar al usuario paso a paso.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Calculadora de Volumen/Peso | POR HACER | Antigravity | Media |
| - Input: dimensiones del tanque (L x W x H) | | | |
| - Output: galones, litros, peso total (agua + roca + arena) | | | |
| - Recomendacion si el mueble lo soporta | | | |
| - Minimo recomendado para principiante (40+ gal) | | | |
| Checklist de Equipamiento Inteligente | HECHO | Claude | -- |
| - 16 equipos con guias detalladas | | | |
| - Warnings de equipos faltantes por prioridad | | | |
| - Detail sheets con que hace, por que importa, tips | | | |
| Wizard de Setup Inicial (New Tank) | POR HACER | Antigravity | Alta |
| - Paso 1: Tipo de tanque (reef, fish only, nano) | | | |
| - Paso 2: Sustrato (aragonita, bare bottom) | | | |
| - Paso 3: Roca (viva vs seca, cantidad por galon) | | | |
| - Paso 4: Aquascaping tips (cuevas, flujo, zonas) | | | |
| - Paso 5: Preparacion de agua (sal a 35ppt, 1.026 SG) | | | |
| - Paso 6: Checklist pre-ciclado | | | |
| Guia de Ensamblaje del Sump | POR HACER | Antigravity | Media |
| - 3 camaras: intake, refugio, return | | | |
| - Donde va cada equipo | | | |
| - Diagrama visual interactivo | | | |

### MODULO 2: Gestor del Ciclado (Maduracion Biologica)

**Objetivo:** El "candado virtual" — no meter peces hasta que el ciclo termine.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Cycle Engine (motor inteligente) | HECHO | Claude | -- |
| - 7 fases: starting, ammonia, nitrite, clearing, complete, mature, stalled | | | |
| - Analiza datos de water tests automaticamente | | | |
| - Progreso 0-100% | | | |
| CycleStatus component (banner en dashboard) | HECHO | Claude | -- |
| Pagina dedicada /cycle (Cycle Tracker) | POR HACER | Claude | Alta |
| - Timeline visual del ciclo con fases coloreadas | | | |
| - Grafica NH3 → NO2 → NO3 en tiempo real | | | |
| - "Dia X de Y estimado" | | | |
| - Consejos por fase (cuando agregar bacterias, etc.) | | | |
| - Alerta verde "SAFE TO STOCK" con confetti | | | |
| - Candado: warning si intentan agregar livestock sin ciclar | | | |
| Acelerador Biologico | POR HACER | Claude | Media |
| - Sugerir productos especificos: Dr. Tim's, Fritz TurboStart | | | |
| - Cuanto agregar segun galones | | | |
| - Metodo del camaron muerto vs ammonia pura | | | |

### MODULO 3: Poblacion y Compatibilidad

**Objetivo:** Evitar compras impulsivas y desastres.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Compatibility Engine | HECHO | Claude | -- |
| Wishlist con check de compatibilidad | HECHO | Antigravity | -- |
| Acclimation Guide | HECHO | Antigravity | -- |
| Species Library (180+ especies) | HECHO | Claude | -- |
| Bioload Calculator | POR HACER | Claude | Alta |
| - Regla: 1 pulgada de pez adulto por 2 galones (conservador) | | | |
| - Input: lista de peces actual + tamano adulto | | | |
| - Output: % capacidad, "te quedan X pulgadas" | | | |
| - Warning si se pasa del 80% | | | |
| - Considerar filtration capacity (skimmer size) | | | |
| Cronograma de Introduccion | POR HACER | Antigravity | Alta |
| - Semana 1-2 post-ciclo: CUC (cleanup crew) | | | |
| - Mes 2: Corales blandos (zoas, mushrooms) | | | |
| - Mes 3: LPS (hammer, torch, frogspawn) | | | |
| - Mes 4+: Peces (pacifico primero, agresivo ultimo) | | | |
| - Mes 6+: SPS (acropora, montipora) solo si params estables | | | |
| - Timeline visual interactivo | | | |
| - Advertencia si el usuario intenta saltarse pasos | | | |

### MODULO 4: Panel de Control y Dosificacion

**Objetivo:** Mantener el agua perfecta con minimo esfuerzo.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Water Test Logging + AI Photo | HECHO | Claude | -- |
| Dosing Calculator (Ca, Alk, Mg) | HECHO | Claude | -- |
| Trend Analysis Engine | HECHO | Claude | -- |
| - Slope por semana, proyeccion 7 dias | | | |
| - "Tu alk bajara a nivel critico en 12 dias" | | | |
| ParamGauge + Sparklines | HECHO | Claude | -- |
| AI Drift Detection on Dashboard | HECHO | Claude | -- |
| Graficas de Tendencia Completas | POR HACER | Claude | Alta |
| - Graficas grandes (no solo sparklines) | | | |
| - Seleccionar rango: 7d, 30d, 90d, all | | | |
| - Overlay de rangos seguros (verde) | | | |
| - Puntos clickeables con valor exacto | | | |
| - Comparar 2 parametros lado a lado | | | |
| Dosificacion Inteligente Automatica | POR HACER | Claude | Media |
| - Conectar dosing calculator con ultimo test | | | |
| - "Basado en tu test de hoy, dosifica X mL de Y" | | | |
| - Sugerir ajustes a dosis del ReefDose | | | |
| Alertas de pH/Salinidad en Tiempo Real | PARCIAL | -- | Baja |
| - Ya tenemos alertas post-test, faltaria integracion con controller | | | |

### MODULO 5: Agenda de Mantenimiento

**Objetivo:** Que el principiante sepa exactamente que hacer cada dia.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Maintenance Task System (DB + API) | HECHO | Claude | -- |
| Dashboard: Overdue/Today/Upcoming | HECHO | Claude | -- |
| Consumable Gauges (vida util) | HECHO | Claude | -- |
| Pagina dedicada /maintenance | POR HACER | Antigravity | Alta |
| - Vista calendario mensual | | | |
| - Filtro por categoria (daily, weekly, monthly) | | | |
| - Streak tracking ("7 dias seguidos sin fallar") | | | |
| - Historial de completados | | | |
| Template de Tareas para Principiante | POR HACER | Claude | Alta |
| - Auto-crear tareas al terminar onboarding: | | | |
|   DIARIO: Alimentar peces, revisar temp, inspeccionar visual | | | |
|   SEMANAL: Cambio de agua 10-20%, limpiar cristales, test agua | | | |
|   QUINCENAL: Limpiar calcetines filtro, revisar ATO | | | |
|   MENSUAL: Limpiar skimmer, limpiar bombas, test Ca/Mg/Alk | | | |
|   TRIMESTRAL: Cambiar carbon, cambiar GFO, calibrar checkers | | | |
|   SEMESTRAL: Cambiar membrana RO, revisar luces, ICP test | | | |
| Notificaciones Push | POR HACER | Antigravity | Media |
| - PWA ya soporta, falta implementar service worker push | | | |
| - "Hora de tu cambio de agua semanal" | | | |
| - "Carbon reactor lleva 30 dias — hora de cambiar" | | | |

### MODULO 6: Diagnostico y Solucion de Problemas

**Objetivo:** "Primeros auxilios" para emergencias del reef.

| Feature | Estado | Quien | Prioridad |
|---|---|---|---|
| Emergency SOS | HECHO | Claude | -- |
| Troubleshooter Engine | HECHO | Claude | -- |
| AI Pest ID (foto → identifica plaga) | POR HACER | Claude | Alta |
| - Subir foto de algo raro → GPT-4o identifica | | | |
| - Aiptasia, flatworms, montipora nudibranchs, red bugs | | | |
| - Cyano, dinos, GHA, bryopsis | | | |
| - Pasos para eliminar con productos del catalogo | | | |
| Hospital de Peces / Cuarentena | POR HACER | Antigravity | Media |
| - Guia de QT tank setup | | | |
| - Protocolos por enfermedad: | | | |
|   Ich → Copper treatment (Copper Power) 14-21 dias | | | |
|   Velvet → Chloroquine phosphate | | | |
|   Brooklynella → Formalin dip | | | |
|   Flukes → Praziquantel | | | |
| - Dosis por galones del QT | | | |
| - Timer de tratamiento con notificaciones | | | |
| Power Outage Emergency Mode | POR HACER | Antigravity | Media |
| - Protocolo paso a paso cuando se va la luz | | | |
| - Prioridades: oxigenacion > temp > circulacion | | | |
| - Cuanto tiempo puede sobrevivir el tanque | | | |
| - Lista de equipo de emergencia (battery pump, etc.) | | | |

---

## Division de Trabajo

### CLAUDE (Backend + AI + Data)
Enfoque: Motores inteligentes, API routes, logica de negocio, integracion AI

| # | Tarea | Prioridad | Estimado |
|---|---|---|---|
| C1 | Pagina /cycle — Cycle Tracker completo con timeline visual | ALTA | 1 sesion |
| C2 | Bioload Calculator — calculo de carga biologica | ALTA | 1 sesion |
| C3 | Graficas de Tendencia completas (recharts, rangos, overlay) | ALTA | 1 sesion |
| C4 | AI Pest ID — /api/identify-pest con GPT-4o Vision | ALTA | 1 sesion |
| C5 | Template de mantenimiento auto-generado post-onboarding | ALTA | 0.5 sesion |
| C6 | Dosificacion inteligente (conectar test → dosing automatico) | MEDIA | 1 sesion |
| C7 | Acelerador biologico (sugerencias de bacterias por fase) | MEDIA | 0.5 sesion |

### ANTIGRAVITY (UI + Content + Education)
Enfoque: Paginas educativas, wizards interactivos, UI polish, contenido

| # | Tarea | Prioridad | Estimado |
|---|---|---|---|
| A1 | Wizard de Setup Inicial (/setup) — 6 pasos interactivos | ALTA | 2 sprints |
| A2 | Cronograma de Introduccion — timeline visual de stocking | ALTA | 1 sprint |
| A3 | Pagina /maintenance — calendario, streaks, historial | ALTA | 2 sprints |
| A4 | Notificaciones Push (service worker) | MEDIA | 1 sprint |
| A5 | Hospital de Peces / Protocolos de Cuarentena | MEDIA | 1 sprint |
| A6 | Power Outage Emergency Mode | MEDIA | 1 sprint |
| A7 | Calculadora de Volumen/Peso del tanque | MEDIA | 0.5 sprint |
| A8 | Guia visual del Sump (diagrama interactivo) | MEDIA | 1 sprint |

### Tareas Compartidas
| Tarea | Claude | Antigravity |
|---|---|---|
| Cycle Tracker | Motor + API | UI de la pagina |
| Bioload Calculator | Logica de calculo | UI interactiva |
| Pest ID | API de vision AI | UI de camara + resultados |

---

## Orden de Ejecucion Recomendado

### Sprint 1 (Inmediato)
- [Claude] C1: Cycle Tracker page
- [Claude] C5: Templates de mantenimiento
- [Antigravity] A1: Setup Wizard (inicio)

### Sprint 2
- [Claude] C2: Bioload Calculator
- [Claude] C3: Graficas de Tendencia
- [Antigravity] A2: Cronograma de Introduccion
- [Antigravity] A3: Maintenance page (inicio)

### Sprint 3
- [Claude] C4: AI Pest ID
- [Claude] C6: Dosificacion inteligente
- [Antigravity] A3: Maintenance page (completa)
- [Antigravity] A4: Push notifications

### Sprint 4
- [Claude] C7: Acelerador biologico
- [Antigravity] A5: Hospital de Peces
- [Antigravity] A6: Power Outage Mode
- [Antigravity] A7: Calculadora de Volumen
- [Antigravity] A8: Guia del Sump

---

## Metricas de Exito

| Metrica | Target |
|---|---|
| Retencion dia 7 | >60% |
| Tests de agua por usuario/mes | >3 |
| Tareas de mantenimiento completadas/semana | >5 |
| Usuarios que completan onboarding | >80% |
| Tiempo en app por sesion | >3 min |

---

## Stack Tecnico

- **Frontend:** Next.js 15, Tailwind CSS, TypeScript
- **Database:** Supabase (Postgres + Auth + Storage + RLS)
- **AI:** OpenAI GPT-4o (Vision + Text)
- **Charts:** Recharts (por implementar para graficas completas)
- **PWA:** Manifest + Service Worker (push pendiente)
- **Deploy:** Vercel (frontend) + Render (API)
- **Design System:** Stitch (Space Grotesk + Inter, Material Symbols, glassmorphism)

---

## Base de Datos Actual

| Tabla | Registros | Uso |
|---|---|---|
| reef_animals | 41+ | Livestock del usuario |
| reef_equipment | 20+ | Equipos del usuario |
| reef_supplements | 13+ | Suplementos del usuario |
| reef_water_tests | Variable | Historico de tests |
| reef_products | 67 | Catalogo de productos |
| reef_user_products | 14+ | Productos del usuario |
| reef_species | 180+ | Library de especies |
| reef_planner_layouts | Variable | Layouts 3D |
| reef_maintenance_tasks | Variable | Tareas programadas |
| reef_articles | Variable | Contenido educativo |
| reef_profiles | Variable | Perfiles de usuario |
| reef_tanks | Variable | Datos del tanque |

---

*Documento creado: Abril 7, 2026*
*Autores: Marcial Larrauri + Claude (AI) + Antigravity (AI)*
