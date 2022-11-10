const SidebarItems = [
    {
        name: "EC",
        route: "/creditor-institutions",
        domain: "ec"
    },
    {
        name: "Intermediari EC",
        route: "/brokers",
        domain: "ec"
    },
    {
        name: "Stazioni",
        route: "/stations",
        domain: "ec"
    },
    {
        name: "Informativa Conto Accredito",
        route: "/icas",
        domain: "ec"
    },
    {
        name: "Verifica ICA",
        route: "/icas/check",
        domain: "ec"
    },
    {
        name: "Tabella delle Controparti",
        route: "/counterparttables",
        domain: "ec"
    },
    {
        name: "PSP",
        route: "/payment-service-providers",
        domain: "psp"
    },
    {
        name: "Intermediari PSP",
        route: "/brokers-psp",
        domain: "psp"
    },
    {
        name: "Canali",
        route: "/channels",
        domain: "psp"
    },
    {
        name: "Catalogo Dati Informativi",
        route: "/cdis",
        domain: "psp"
    },
    {
        name: "Verifica Catalogo Dati Informativi",
        route: "/cdis/check",
        domain: "psp"
    },
    {
        name: "Configuration Keys",
        route: "/configuration-keys",
        domain: "configuration"
    },
    {
        name: "PDD",
        route: "/pdds",
        domain: "configuration"
    },
    {
        name: "WFESP Plugins",
        route: "/wfesp-plugins",
        domain: "configuration"
    }, {
        name: "Tipo Versamento",
        route: "/payment-types",
        domain: "configuration"
    },
    {
        name: "Caricamenti Massivi",
        route: "/massive/loading",
        domain: "batchoperation"
    },
    {
        name: "Migrazioni Massive",
        route: "/massive/migration",
        domain: "batchoperation"
    },
    {
        name: "Operazioni Massive ICA",
        route: "/massive/icas",
        domain: "batchoperation"
    },
];

export default SidebarItems;
