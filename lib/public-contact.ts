export const publicContact={
 phone:'0343977651',
 email:'luanlengoc1991@gmail.com',
 zaloHref:'https://zalo.me/0343977651',
 facebookHref:'https://www.facebook.com/luan.lengoc.5/',
 logo:'/alpha-hub-logo.png',
 alphahubImage:'',
} as const;

export type PublicContact = {phone: string; email: string; zaloHref: string; facebookHref: string; logo: string; alphahubImage: string};
export function resolvePublicContact(settings: {phone?: string; email?: string; logo?: string; alphahubImage?: string}): PublicContact {
 const phone = settings.phone?.trim() || publicContact.phone;
 return {...publicContact, phone, email: settings.email?.trim() || publicContact.email, zaloHref: 'https://zalo.me/' + phone.replace(/\D/g, ''), logo: settings.logo?.trim() || publicContact.logo, alphahubImage: settings.alphahubImage?.trim() || ''};
}
