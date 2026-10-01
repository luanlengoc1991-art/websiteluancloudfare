'use client';

import {createContext, useContext, type ReactNode} from 'react';
import {publicContact, type PublicContact} from '@/lib/public-contact';

const ContactContext = createContext<PublicContact>(publicContact);
export function PublicContactProvider({contact, children}: {contact: PublicContact; children: ReactNode}) {
  return <ContactContext.Provider value={contact}>{children}</ContactContext.Provider>;
}
export function usePublicContact() { return useContext(ContactContext); }
