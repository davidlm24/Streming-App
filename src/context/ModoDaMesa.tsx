import { createContext, useContext } from 'react';

/**
 * Como a mesa corta, para os painéis falarem a língua certa: no modo DIRETO
 * (o padrão) não existe preview — o que os painéis ligam vai ao programa na
 * hora, e os rótulos dizem "programa". Com a mesa de corte ligada, volta o
 * vocabulário do preview e do corte.
 */
export const ModoDireto = createContext(true);

export const useModoDireto = () => useContext(ModoDireto);

/** A palavra do destino do que os painéis ligam: "programa" ou "preview". */
export function useDestinoDoPalco(): 'programa' | 'preview' {
  return useModoDireto() ? 'programa' : 'preview';
}
