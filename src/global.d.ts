// src/global.d.ts

declare namespace JSX {
  interface IntrinsicElements {
    'payment-methods-manager': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      // Qui dichiari le proprietà che il tuo componente accetta
      jwt?: string; 
      // Aggiungi altre eventuali proprietà qui, es: 'config?: object;'
    };
  }
}