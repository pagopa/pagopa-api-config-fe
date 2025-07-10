
declare namespace JSX {
  interface IntrinsicElements {
    'payment-methods-manager': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      host: string; 
      jwt: string; 
    };
  }
}