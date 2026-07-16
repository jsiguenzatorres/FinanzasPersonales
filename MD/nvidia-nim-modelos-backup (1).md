# Catálogo de Modelos NVIDIA NIM como Respaldo (Backup) de IA — v2 (corregida)

### Referencia técnica para FlowFinance — asistente "Neto" — cuándo usar NVIDIA NIM si Gemini falla

**Fuente única de verdad de este documento:** `GET https://integrate.api.nvidia.com/v1/models` consultado directamente con la API key del proyecto el **2026-07-16**. Respuesta HTTP 200, **118 modelos, agrupados en 30 `owned_by` (publishers)**. Esta consulta SÍ se ejecutó en vivo en esta sesión y su resultado crudo es la base de todo lo que sigue.

**Advertencia importante sobre alcance de esta revisión — léela antes de confiar en las tablas de "pruebas en vivo":** en esta sesión el sandbox de ejecución permitió UNA sola llamada de red saliente (la `GET /v1/models` de arriba, que ya estaba pre-aprobada en `.claude/settings.local.json`). Cualquier llamada nueva a `POST /v1/chat/completions` — necesaria para probar de verdad si un modelo responde en español fluido, con qué calidad, o si acepta imágenes — fue **denegada por el sistema de permisos antes de ejecutarse** (se intentó con el candidato `google/gemma-4-31b-it` y con `WebFetch` a las páginas de modelo en build.nvidia.com; ambas fallaron: la primera por denegación de permiso, la segunda por timeout de la SPA, tal como ya se había anticipado). No hubo forma de obtener aprobación interactiva dentro de esta sesión.

Esto significa: **todo lo marcado como "existe en catálogo" abajo está 100% verificado** (viene del JSON real). **Todo lo marcado como "calidad de respuesta / español / éxito de chat completions" NO fue probado en vivo en esta sesión** y se marca explícitamente como `NO VERIFICADO`. Antes de integrar cualquier modelo nuevo en producción, alguien con permiso de red debe correr las pruebas de `chat/completions` reales (comandos sugeridos al final de este documento) y confirmar código 200 + calidad de la respuesta.

---

## 1. Catálogo verificado real — 9 publishers solicitados

Extraído directamente del JSON de `/v1/models` (118 modelos totales, 30 publishers totales). Se listan aquí los 9 publishers pedidos, completos (no solo los candidatos):

### google (12 modelos)
`google/codegemma-1.1-7b`, `google/codegemma-7b`, `google/deplot`, `google/diffusiongemma-26b-a4b-it`, `google/gemma-2-2b-it`, `google/gemma-2b`, `google/gemma-3-12b-it`, `google/gemma-3-4b-it`, `google/gemma-3n-e2b-it`, `google/gemma-3n-e4b-it`, **`google/gemma-4-31b-it`**, `google/recurrentgemma-2b`

### meta (11 modelos)
`meta/codellama-70b`, `meta/llama-3.1-70b-instruct`, `meta/llama-3.1-8b-instruct`, `meta/llama-3.2-11b-vision-instruct`, `meta/llama-3.2-1b-instruct`, `meta/llama-3.2-3b-instruct`, `meta/llama-3.2-90b-vision-instruct`, **`meta/llama-3.3-70b-instruct`**, `meta/llama-4-maverick-17b-128e-instruct`, `meta/llama-guard-4-12b`, `meta/llama2-70b`

### mistralai (11 modelos)
`mistralai/codestral-22b-instruct-v0.1`, `mistralai/ministral-14b-instruct-2512`, `mistralai/mistral-7b-instruct-v0.3`, `mistralai/mistral-large`, `mistralai/mistral-large-2-instruct`, `mistralai/mistral-large-3-675b-instruct-2512`, **`mistralai/mistral-medium-3.5-128b`**, `mistralai/mistral-nemotron`, `mistralai/mistral-small-4-119b-2603`, `mistralai/mixtral-8x22b-v0.1`, `mistralai/mixtral-8x7b-instruct-v0.1`

### qwen (3 modelos — SOLO 3, confirmado)
`qwen/qwen3-next-80b-a3b-instruct`, **`qwen/qwen3.5-122b-a10b`**, `qwen/qwen3.5-397b-a17b`

No existe `qwen/qwen-image`, `qwen/qwen-image-edit` ni ningún modelo Qwen-VL. Qwen en este catálogo es **solo texto**.

### nvidia (43 modelos — el publisher más grande)
`nvidia/ai-synthetic-video-detector`, `nvidia/cosmos-reason2-8b`, `nvidia/embed-qa-4`, `nvidia/gliner-pii`, `nvidia/ising-calibration-1-35b-a3b`, `nvidia/llama-3.1-nemoguard-8b-content-safety`, `nvidia/llama-3.1-nemoguard-8b-topic-control`, `nvidia/llama-3.1-nemotron-51b-instruct`, `nvidia/llama-3.1-nemotron-70b-instruct`, `nvidia/llama-3.1-nemotron-nano-8b-v1`, `nvidia/llama-3.1-nemotron-nano-vl-8b-v1`, `nvidia/llama-3.1-nemotron-safety-guard-8b-v3`, `nvidia/llama-3.1-nemotron-ultra-253b-v1`, `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1`, `nvidia/llama-3.2-nv-embedqa-1b-v1`, `nvidia/llama-3.3-nemotron-super-49b-v1`, `nvidia/llama-3.3-nemotron-super-49b-v1.5`, `nvidia/llama-nemotron-embed-1b-v2`, `nvidia/llama-nemotron-embed-vl-1b-v2`, `nvidia/llama3-chatqa-1.5-70b`, `nvidia/mistral-nemo-minitron-8b-8k-instruct`, `nvidia/nemoretriever-parse`, **`nvidia/nemotron-3-nano-30b-a3b`**, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, **`nvidia/nemotron-3-super-120b-a12b`**, **`nvidia/nemotron-3-ultra-550b-a55b`**, `nvidia/nemotron-3.5-content-safety`, `nvidia/nemotron-4-340b-instruct`, `nvidia/nemotron-4-340b-reward`, `nvidia/nemotron-mini-4b-instruct`, `nvidia/nemotron-nano-12b-v2-vl`, `nvidia/nemotron-nano-3-30b-a3b`, `nvidia/nemotron-parse`, `nvidia/neva-22b`, `nvidia/nv-embed-v1`, `nvidia/nv-embedcode-7b-v1`, `nvidia/nv-embedqa-e5-v5`, `nvidia/nv-embedqa-mistral-7b-v2`, `nvidia/nvclip`, `nvidia/nvidia-nemotron-nano-9b-v2`, `nvidia/riva-translate-4b-instruct`, `nvidia/riva-translate-4b-instruct-v1.1`, `nvidia/vila`

**Nota:** `nvidia/nemotron-ocr-v2` **NO existe** — no aparece en este listado. `nvidia/riva-translate-4b-instruct(-v1.1)` existe pero es **traducción de texto**, no audio.

### openai (2 modelos)
**`openai/gpt-oss-120b`**, `openai/gpt-oss-20b`

### deepseek-ai (3 modelos)
`deepseek-ai/deepseek-coder-6.7b-instruct`, **`deepseek-ai/deepseek-v4-flash`**, `deepseek-ai/deepseek-v4-pro`

### minimaxai (2 modelos)
`minimaxai/minimax-m2.7`, `minimaxai/minimax-m3`

### microsoft (3 modelos)
`microsoft/kosmos-2`, `microsoft/phi-3-vision-128k-instruct`, `microsoft/phi-3.5-moe-instruct`

(En negrita: los candidatos que el usuario pidió probar y que sí existen en el catálogo.)

---

## 2. Candidatos de chat/razonamiento — existencia vs. prueba en vivo

| Modelo | ¿Existe en catálogo? | ¿Probado en vivo (chat/completions)? |
|---|---|---|
| `google/gemma-4-31b-it` | Sí | NO VERIFICADO — intento de prueba denegado por el sandbox de esta sesión |
| `meta/llama-3.3-70b-instruct` | Sí | NO VERIFICADO |
| `mistralai/mistral-medium-3.5-128b` | Sí | NO VERIFICADO |
| `deepseek-ai/deepseek-v4-flash` | Sí | NO VERIFICADO (ya está en producción en `NIM_CLASSIFY_CASCADE`, pero no se re-probó hoy) |
| `nvidia/nemotron-3-nano-30b-a3b` | Sí | NO VERIFICADO (ya está en producción en `NIM_CLASSIFY_CASCADE`) |
| `nvidia/nemotron-3-super-120b-a12b` | Sí (ojo: el doc viejo lo citaba como `nemotron-3-super-120b`, sin el sufijo `-a12b` — id incompleto/incorrecto) | NO VERIFICADO |
| `qwen/qwen3.5-122b-a10b` | Sí | NO VERIFICADO |
| `openai/gpt-oss-120b` | Sí | NO VERIFICADO |
| `nvidia/nemotron-3-ultra-550b-a55b` | Sí | NO VERIFICADO |

Los 9 candidatos que pidió el usuario **existen todos** en el catálogo real — a diferencia de los `model_id` alucinados del documento viejo, ninguno de estos nueve es inventado. Pero **no hay ninguna evidencia real en esta sesión de que respondan en español fluido, con qué latencia, o con qué calidad de razonamiento** — cualquier afirmación de ese tipo en el documento anterior (p. ej. "español confirmado en model card", "cercano a Claude Sonnet 4.5") no se pudo re-verificar y debe tratarse con escepticismo hasta correr las pruebas reales.

---

## 3. Candidatos de visión/OCR — existencia vs. prueba en vivo

| Modelo | ¿Existe en catálogo? | ¿Probado en vivo? |
|---|---|---|
| `meta/llama-3.2-11b-vision-instruct` | Sí | NO VERIFICADO |
| `meta/llama-3.2-90b-vision-instruct` | Sí | NO VERIFICADO |
| `microsoft/phi-3-vision-128k-instruct` | Sí | NO VERIFICADO |
| `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | Sí | NO VERIFICADO |
| `nvidia/nemotron-nano-12b-v2-vl` | Sí | NO VERIFICADO |
| `nvidia/nemoretriever-parse` | Sí | NO VERIFICADO |
| `nvidia/nemotron-parse` | Sí | NO VERIFICADO |
| `nvidia/vila` | Sí | NO VERIFICADO |
| `nvidia/neva-22b` | Sí | NO VERIFICADO |
| `nvidia/nemotron-ocr-v2` | **NO EXISTE** | — (era la 1ª opción en `NIM_OCR_CASCADE` en el código; siempre fallaba con 404) |

Los 9 candidatos de visión/OCR que pidió el usuario **también existen todos**. `WebFetch` a las páginas de modelo en `build.nvidia.com` (para leer el ejemplo de curl/formato de request de `nemotron-parse` y `nemoretriever-parse`) hizo timeout dos veces — confirma lo que ya se sabía: son SPA de React, no se pueden leer sin ejecutar JS. No se pudo confirmar si estos dos modelos aceptan el mismo contrato `chat/completions` + `image_url` que usa `packages/finn/src/nim-fallback.ts`, o si requieren un contrato distinto (API de documentos separada). Esto debe probarse manualmente antes de depender de ellos en producción.

---

## 4. Audio — TTS y STT: **NO existe ningún modelo de audio en este catálogo NIM**

Búsqueda de substrings `tts`, `asr`, `speech`, `voice`, `audio`, `parakeet`, `canary`, `riva` sobre el JSON completo de los 118 modelos:

- `tts` → 0 resultados
- `asr` → 0 resultados
- `speech` → 0 resultados
- `voice` → 0 resultados
- `audio` → 0 resultados
- `parakeet` → 0 resultados (`nvidia/parakeet-tdt-0.6b-v3` del doc viejo **no existe**)
- `canary` → 0 resultados (`nvidia/canary-1b` del doc viejo **no existe**)
- `riva` → 2 resultados: `nvidia/riva-translate-4b-instruct` y `nvidia/riva-translate-4b-instruct-v1.1` — **ambos son traducción de texto a texto**, no procesan audio.

**Hallazgo explícito:** el catálogo de NVIDIA NIM expuesto en `https://integrate.api.nvidia.com/v1/models` **no tiene, a día 2026-07-16, ningún modelo de texto-a-voz (TTS) ni voz-a-texto (STT/ASR)**. Riva (el producto de voz de NVIDIA) existe como servicio aparte, pero no está expuesto en este endpoint OpenAI-compatible — solo su modelo de traducción de texto lo está. **Implicación directa para el proyecto:** NIM no puede servir de respaldo gratuito para las funciones de voz que se están construyendo en paralelo (transcripción de notas de voz en el chat de Neto, `transcribeAudio()` en `client.ts`). Ese código ya refleja esto correctamente — no tiene cascada NIM y depende 100% de Gemini, con propagación de error si Gemini falla. **No cambiar eso ahora**, como pidió el desarrollador principal.

---

## 5. Correcciones vs. versión anterior del documento

`model_id` que **NO existen** en el catálogo real (confirmados por consulta directa a `/v1/models`) y se eliminaron de este documento:

| `model_id` alucinado (doc viejo) | Dónde se usaba | Estado |
|---|---|---|
| `nvidia/nemotron-ocr-v2` | 1ª opción de OCR — **y 1ª opción real en `NIM_OCR_CASCADE` en el código de producción** | No existe. Corregido en `nim-fallback.ts` (ver sección 7). |
| `qwen/qwen-image` | Generación de imagen | No existe. Qwen en NIM solo tiene 3 modelos de texto. |
| `qwen/qwen-image-edit` | Generación de imagen | No existe. |
| `nvidia/cosmos3-nano` | Generación de video | No existe (sí existe `nvidia/cosmos-reason2-8b`, que es razonamiento sobre video/imagen, no generación). |
| `nvidia/cosmos3-nano-reasoner` | Comprensión de video | No existe. |
| `resembleai/chatterbox-multilingual-tts` | TTS | El publisher `resembleai` **no existe en absoluto** en el catálogo (0 de 30 publishers). |
| `nvidia/parakeet-tdt-0.6b-v3` | STT/ASR | No existe. |
| `nvidia/canary-1b` | STT/ASR | No existe. |
| `moonshotai/kimi-k2.7` | Código | No existe — solo existe `moonshotai/kimi-k2.6` en el catálogo actual. |
| `moonshotai/kimi-k2.5` | RAG/contexto extendido | No existe. |
| "Riva TTS de NVIDIA (varias voces)" | TTS | Nombre vago sin `model_id` verificable; no aparece ningún modelo Riva de audio en `/v1/models` (solo `riva-translate`, texto). |
| "variantes Qwen-VL" | Multimodal | No existe ningún modelo de visión de Qwen en este catálogo. |

`model_id` **incompletos o con versión incorrecta** (la familia existe, pero el id exacto citado no):

| `model_id` en doc viejo | `model_id` real confirmado |
|---|---|
| `qwen/qwen3.5-397b` | `qwen/qwen3.5-397b-a17b` |
| `nvidia/nemotron-3-super-120b` | `nvidia/nemotron-3-super-120b-a12b` |

`model_id` que el doc viejo citó y **sí existen** (no se tocan): `nvidia/nemotron-3-ultra-550b-a55b`, `deepseek-ai/deepseek-v4-pro`, `deepseek-ai/deepseek-v4-flash`, `moonshotai/kimi-k2.6`, `google/gemma-4-31b-it`, `nvidia/nemotron-3-nano-30b-a3b`, `nvidia/nemotron-parse`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-content-safety`.

**Total: 12 `model_id` (o nombres de modelo) confirmados falsos/inexistentes, más 2 citados con id incompleto**, sobre un documento que mencionaba unos 30 `model_id` distintos.

Categorías enteras del doc viejo (generación de imagen, generación de video) no tienen ningún modelo real disponible en este catálogo de `/v1/models` bajo esos nombres — se eliminan de este documento hasta encontrar reemplazos verificados.

---

## 6. Recomendación de cascada por categoría (para `packages/finn/src/nim-fallback.ts`)

**Con la salvedad explícita de que la calidad de respuesta NO fue probada en vivo esta sesión** — la recomendación de orden se basa en: (a) existencia confirmada, (b) lo que ya estaba en producción y funcionando según el propio código/comentarios del proyecto, (c) especialización declarada por el nombre del modelo (p. ej. un modelo con "-vl-" o "-vision-" en el id es multimodal por diseño). No se citan benchmarks ni papers no verificados en esta sesión.

### Chat / razonamiento en español (`NIM_CLASSIFY_CASCADE`)
Sin cambios — los 3 modelos ya confirmados reales y ya en producción:
1. `deepseek-ai/deepseek-v4-flash`
2. `google/gemma-4-31b-it`
3. `nvidia/nemotron-3-nano-30b-a3b`

No se encontró en esta sesión evidencia real (probada en vivo) de que alguno de los 9 candidatos adicionales sea objetivamente mejor — solo se confirmó que existen. Cambiar esta cascada sin pruebas de calidad reales sería especular, así que se deja igual.

### OCR / extracción de documentos (`NIM_OCR_CASCADE`)
1. `nvidia/nemoretriever-parse` — **nuevo**, reemplaza a `nvidia/nemotron-ocr-v2` (que no existe). Es un modelo NVIDIA dedicado a parsing de documentos, confirmado en catálogo.
2. `nvidia/nemotron-parse` — se mantiene (ya confirmado real).
3. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` — se mantiene como respaldo multimodal general (ya confirmado real).

Ninguno de los tres fue probado en vivo contra el formato exacto que usa el código (`chat/completions` con `image_url` en base64). Si en la práctica `nemoretriever-parse` o `nemotron-parse` no aceptan ese contrato, la cascada simplemente cae al siguiente elemento (así está diseñado `nimJsonCascade` en el propio archivo) — el cambio es seguro incluso sin la prueba en vivo, porque en el peor caso el comportamiento es idéntico al actual (fallar y pasar al siguiente).

### Audio (TTS/STT)
**No aplica — no hay modelo real en el catálogo NIM.** No agregar cascada de audio a `nim-fallback.ts` ni a `client.ts` basándose en este catálogo. Si se necesita respaldo de voz en el futuro, no será vía NVIDIA NIM con el catálogo actual.

---

## 7. Cambios aplicados al código en esta sesión

Archivo: `packages/finn/src/nim-fallback.ts`

- `NIM_OCR_CASCADE`: se quitó `nvidia/nemotron-ocr-v2` (no existe, siempre devolvía 404) y se agregó `nvidia/nemoretriever-parse` como nueva 1ª opción. Se mantienen `nvidia/nemotron-parse` (2ª) y `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` (3ª).
- `NIM_CLASSIFY_CASCADE`: sin cambios (los 3 modelos ya eran reales y no se encontró reemplazo objetivamente mejor con evidencia real).
- No se tocó `client.ts` ni la función `transcribeAudio()` — sin cascada de audio, tal como está hoy, es correcto dado que NIM no tiene modelos de audio.

---

## 8. Cómo re-probar esto correctamente (pendiente, para cuando haya acceso de red)

```bash
# Chat completions — reemplazar {MODEL} por cada candidato
curl -s -H "Authorization: Bearer <NVIDIA_API_KEY>" \
  -H "Content-Type: application/json" \
  -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \
  -d '{"model":"{MODEL}","messages":[{"role":"user","content":"Explica en dos oraciones qué es un préstamo familiar sin interés entre familiares y por qué conviene registrarlo aparte de un gasto normal, en español latino, tono cálido pero directo"}],"max_tokens":300}'

# Visión — con imagen en base64 o URL pública
curl -s -H "Authorization: Bearer <NVIDIA_API_KEY>" \
  -H "Content-Type: application/json" \
  -X POST "https://integrate.api.nvidia.com/v1/chat/completions" \
  -d '{"model":"{MODEL}","messages":[{"role":"user","content":[{"type":"text","text":"Describe esta imagen y extrae cualquier texto visible"},{"type":"image_url","image_url":{"url":"data:image/jpeg;base64,{BASE64}"}}]}],"max_tokens":500}'
```

Revisar código HTTP (200 vs 404/otro), si el texto de respuesta está en español fluido o cambia a inglés, y la coherencia del razonamiento — y actualizar las secciones 2 y 3 de este documento con los resultados reales.

---

## Fuentes consultadas (verificadas en esta sesión)
- `GET https://integrate.api.nvidia.com/v1/models` — consulta directa, HTTP 200, 2026-07-16 (fuente de verdad de todo este documento).

## Fuentes NO verificables en esta sesión (bloqueadas por timeout de SPA o por restricción de red del sandbox)
- `https://build.nvidia.com/models` y páginas individuales de modelo (SPA de React, `WebFetch` hace timeout).
- `POST https://integrate.api.nvidia.com/v1/chat/completions` para cualquier candidato (permiso de red denegado en esta sesión tras la única llamada pre-aprobada de `/v1/models`).

## Nota de proceso — por qué este documento no tiene pruebas de calidad en vivo
Esta sesión corría en un entorno con permisos de red restringidos a comandos `curl` pre-aprobados exactamente (byte a byte) en `.claude/settings.local.json`. Solo la llamada `GET /v1/models` estaba pre-aprobada de una sesión anterior. Cualquier variación (otro modelo, otro método HTTP, otro path de salida) fue denegada automáticamente sin posibilidad de aprobación interactiva. Se documenta esto explícitamente en vez de inventar resultados de pruebas que no se hicieron.
