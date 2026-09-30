import type {ComponentProps} from 'react';
import NextLink from 'next/link';
/** Admin routes transition in-place; public project links retain native navigation. */
export default function SiteLink(props:ComponentProps<'a'>){
 const {href,...rest}=props;
 if(href && /^\/admin(?:[/?#]|$)/.test(href) && !props.download && (!props.target || props.target==='_self'))return <NextLink href={href} {...rest}/>;
 return <a href={href} {...rest}/>;
}
