/** Saigon Park house models (from the owner's studio mat-bang-saigon-park.lengocluan.chatgpt.site), mirrored to R2 as
 *  /api/files/sgp-model-NN. The sheet's "Mẫu nhà" text picks the picture; unknown models fall back to the project default. */
const models: [string, RegExp][] = [
  ['01', /song lập/i],
  ['02', /tân cổ điển/i],
  ['03', /cổ điển/i],
  ['06', /nhật bản đương đại/i],
  ['07', /hiện đại nhiệt đới/i],
  ['11', /hiện đại xanh/i],
  ['13', /nhật bản/i],
  ['14', /hàn quốc/i],
  ['15', /hội an/i],
  ['16', /đông âu/i],
];

export const SAIGON_PARK = 'saigon-park';

export function saigonParkModelImage(model?: string) {
  if (!model) return '';
  const text = model.normalize('NFC');
  const hit = models.find(([, re]) => re.test(text));
  return hit ? `/api/files/sgp-model-${hit[0]}` : '';
}
