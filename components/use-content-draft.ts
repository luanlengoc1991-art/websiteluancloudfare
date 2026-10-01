'use client';

import {useEffect, useRef, useState} from 'react';

export function useContentDraft<T>(initial: T) {
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const current = useRef(initial);
  useEffect(() => {if (!dirty) {current.current = initial; setDraft(initial);}}, [initial, dirty]);
  return {draft, edit: (value: T) => {current.current = value; setDraft(value); setDirty(true);}, saved: (value: T) => {if (current.current === value) setDirty(false);}};
}

