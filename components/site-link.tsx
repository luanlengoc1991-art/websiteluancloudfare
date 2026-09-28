import type {ComponentProps} from 'react';
/** Ordinary same-origin navigation also works before hydration and from embedded previews. */
export default function SiteLink(props:ComponentProps<'a'>){return <a {...props}/>;}
