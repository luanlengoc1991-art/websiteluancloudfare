/** Saigon Park house models (from the owner's former studio), mirrored to R2 as /api/files/sgp-model-NN.
 *  The sheet's "Mẫu nhà" text picks the picture and the list colour; unknown models fall back to the project default. */
const models: [string, RegExp, string][] = [
  ['01', /song lập/i, '#D317E7'],
  ['02', /tân cổ điển/i, '#FF8081'],
  ['03', /cổ điển/i, '#FF9D70'],
  ['06', /nhật bản đương đại/i, '#9EB4E3'],
  ['07', /hiện đại nhiệt đới/i, '#5EEAFB'],
  ['11', /hiện đại xanh/i, '#A9FFA8'],
  ['13', /nhật bản/i, '#B76D6E'],
  ['14', /hàn quốc/i, '#97C272'],
  ['15', /hội an/i, '#FFFF01'],
  ['16', /đông âu/i, '#FF81FF'],
];

export const SAIGON_PARK = 'saigon-park';

const find = (model?: string) => model ? models.find(([, re]) => re.test(model.normalize('NFC'))) : undefined;
export const saigonParkModelImage = (model?: string) => {const hit = find(model); return hit ? `/api/files/sgp-model-${hit[0]}` : '';};
export const saigonParkModelColor = (model?: string) => find(model)?.[2] || '#cbd5d1';
