export const publicContact={
 phone:'0343977651',
 email:'luanlengoc1991@gmail.com',
 zaloHref:'https://zalo.me/0343977651',
 facebookHref:'https://www.facebook.com/luan.lengoc.5/',
} as const;

export type PublicContact = {phone: string; email: string; zaloHref: string; facebookHref: string};
export function resolvePublicContact(settings: {phone?: string; email?: string}): PublicContact {
 const phone = settings.phone?.trim() || publicContact.phone;
 return {...publicContact, phone, email: settings.email?.trim() || publicContact.email, zaloHref: 'https://zalo.me/' + phone.replace(/\D/g, '')};
}
