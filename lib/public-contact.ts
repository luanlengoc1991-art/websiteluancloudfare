export const publicContact={
 phone:'0343977651',
 email:'luanlengoc1991@gmail.com',
 zaloHref:'https://zalo.me/0343977651',
 facebookHref:'https://www.facebook.com/luan.lengoc.5/',
 logo:'/alpha-hub-logo.png',
 /** LUAN GROUP horizontal logos (site library). Header and footer sit on white → green logo by default. */
 logoHeader:'/api/files/logo-luangroup-color',
 logoFooter:'/api/files/logo-luangroup-color',
 logoHeaderWidth:210,
 logoFooterWidth:300,
 alphahubImage:'',
} as const;

export type PublicContact = {phone: string; email: string; zaloHref: string; facebookHref: string; logo: string; logoHeader: string; logoFooter: string; logoHeaderWidth: number; logoFooterWidth: number; alphahubImage: string};
export function resolvePublicContact(settings: {phone?: string; email?: string; logo?: string; logoHeader?: string; logoFooter?: string; logoHeaderWidth?: number; logoFooterWidth?: number; alphahubImage?: string}): PublicContact {
 const phone = settings.phone?.trim() || publicContact.phone;
 return {...publicContact, phone, email: settings.email?.trim() || publicContact.email, zaloHref: 'https://zalo.me/' + phone.replace(/\D/g, ''), logo: settings.logo?.trim() || publicContact.logo, logoHeader: settings.logoHeader?.trim() || publicContact.logoHeader, logoFooter: settings.logoFooter?.trim() || publicContact.logoFooter, logoHeaderWidth: settings.logoHeaderWidth || publicContact.logoHeaderWidth, logoFooterWidth: settings.logoFooterWidth || publicContact.logoFooterWidth, alphahubImage: settings.alphahubImage?.trim() || ''};
}
