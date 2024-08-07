import React from "react";
import { Alert, Badge, Breadcrumb, Button, Card, Form, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { FaCheck, FaEdit, FaInfoCircle, FaPlus, FaSpinner, FaTimes, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { MsalContext } from "@azure/msal-react";
import AsyncSelect from 'react-select/async';
import debounce from "lodash.debounce";
import { apiClient } from "../../util/apiClient";
import { CreditorInstitutionDetails } from "../../../generated/api/CreditorInstitutionDetails";
import { loginRequest } from "../../authConfig";
import ConfirmationModal from "../../components/ConfirmationModal";
import CountryCode from "../../components/CountryCode";

interface IProps {
    match: {
        params: Record<string, unknown>;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    backup: any;
    ciName: string;
    code: string;
    creditorInstitution: CreditorInstitutionDetails;
    address: any;
    edit: boolean;
    ibanList: [];
    stationList: [];
    encodings: [];
    encodingMgmt: any;
    stationMgmt: any;
    confirmationModal: any;
}

export default class EditCreditorInstitution extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            backup: {
                creditorInstitution: {} as CreditorInstitutionDetails,
                address: {},
                ibans: [],
                stations: [],
                encodings: []
            },
            ciName: "",
            code: "",
            creditorInstitution: {} as CreditorInstitutionDetails,
            address: {},
            edit: false,
            ibanList: [],
            stationList: [],
            encodings: [],
            encodingMgmt: {
                create: false,
                encode: {}
            },
            stationMgmt: {
                create: false,
                delete: false,
                edit: false,
                station: {}
            },
            confirmationModal: {
                show: false,
                description: "",
                list: ""
            }
        };

        this.handleChange = this.handleChange.bind(this);
        this.saveCreditorInstitution = this.saveCreditorInstitution.bind(this);
        this.discard = this.discard.bind(this);
        this.createEncoding = this.createEncoding.bind(this);
        this.saveEncoding = this.saveEncoding.bind(this);
        this.discardEncoding = this.discardEncoding.bind(this);
        this.handleEncodingChange = this.handleEncodingChange.bind(this);
        this.hideDeleteModal = this.hideDeleteModal.bind(this);
        this.createStation = this.createStation.bind(this);
        this.saveStation = this.saveStation.bind(this);
        this.discardStation = this.discardStation.bind(this);
        this.debouncedStationOptions = this.debouncedStationOptions.bind(this);
        this.handleStationEdit = this.handleStationEdit.bind(this);
        this.handleStationDelete = this.handleStationDelete.bind(this);
    }

    generateAddress(address: any) {
        const addr = ["location", "city", "zip_code", "country_code", "tax_domicile"];
        for (const key of addr) {
            // eslint-disable-next-line no-prototype-builtins
            if (!address.hasOwnProperty(key)) {
                // eslint-disable-next-line functional/immutable-data
                address[key] = "";
            }
        }
        return address;
    }

    updateBackup(section: string, data: CreditorInstitutionDetails | any) {
        // eslint-disable-next-line functional/no-let
        let backup = { ...this.state.backup };
        backup = { ...backup, [section]: data };
        this.setState({ backup });
    }

    manageState(ciData: any) {
        const ci = { ...ciData, address: this.generateAddress(ciData.address) };
        this.setState({ creditorInstitution: ci });
        this.setState({ address: ci.address });
        this.setState({ ciName: ci.business_name });
        this.updateBackup("creditorInstitution", ci);
        this.updateBackup("address", ci.address);
    }

    getCreditorInstitution(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitution({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.manageState(response.right.value);
                    } else {
                        this.setState({ isError: true });
                    }
                })
                    .catch(() => {
                        this.setState({ isError: true });
                    })
                    .finally(() => this.setState({ isLoading: false }));
            });
    }

    getIbans(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutionsIbans({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({ ibanList: response.right.value.ibans });
                        this.updateBackup("ibans", response.right.value.ibans);
                    } else {
                        this.setState({ isError: true });
                    }
                })
                    .catch(() => {
                        this.setState({ isError: true });
                    });
            });
    }

    getStations(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutionStations({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({ stationList: response.right.value.stations });
                        this.updateBackup("stations", response.right.value.stations);
                    } else {
                        this.setState({ isError: true });
                    }
                })
                    .catch(() => {
                        this.setState({ isError: true });
                    });
            });
    }

    getEncodings(code: string): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getCreditorInstitutionEncodings({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: code
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        this.setState({ encodings: response.right.value.encodings });
                        this.updateBackup("encodings", response.right.value.encodings);
                    } else {
                        this.setState({ isError: true });
                    }
                })
                    .catch(() => {
                        this.setState({ isError: true });
                    });
            });
    }

    componentDidMount(): void {
        const code: string = this.props.match.params.code as string;
        this.setState({ code, isError: false });
        this.getCreditorInstitution(code);
        this.getIbans(code);
        this.getStations(code);
        this.getEncodings(code);
    }

    handleChange(event: any, obj: string) {
        // eslint-disable-next-line functional/no-let
        let creditorInstitution: CreditorInstitutionDetails = this.state.creditorInstitution;
        const key = event.target.name as string;
        if (obj === "creditorInstitution") {
            const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
            creditorInstitution = { ...creditorInstitution, [key]: value };
        } else {
            const value = event.target.value;
            const address = { ...creditorInstitution.address, [key]: value };
            creditorInstitution = { ...creditorInstitution, address };
            this.setState({ address });
        }
        this.setState({ creditorInstitution });
    }

    toastError(message: string) {
        toast.error(() => <div className={"toast-width"}>{message}</div>, { theme: "colored" });
    }

    saveCreditorInstitution() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateCreditorInstitution({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    body: this.state.creditorInstitution
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Modifica avvenuta con successo.");
                        this.manageState(response.right.value);
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                });
            });
    }

    discard(section: string) {
        // "as any" is necessary because it seems to be a bug: https://github.com/Microsoft/TypeScript/issues/13948
        this.setState({ [section]: Object.assign({}, this.state.backup[section]) } as any);
        this.setState({ address: Object.assign({}, this.state.backup.address) } as any);
    }

    createEncoding(): void {
        const encodingMgmt = {
            create: true,
            delete: false,
            encode: {
                code_type: "QR_CODE",
                encoding_code: ""
            }
        };
        this.setState({ encodingMgmt });
    }

    saveEncoding(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createCreditorInstitutionEncoding({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    body: this.state.encodingMgmt.encode
                }).then((response: any) => {
                    if (response.right.status === 201) {
                        toast.info("Salvataggio avvenuto con successo.");
                        this.getEncodings(this.state.code);
                        this.discardEncoding();
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                });
            });
    }

    discardEncoding(): void {
        const encodingMgmt = {
            create: false,
            delete: false,
            encode: {
                code_type: "QR_CODE",
                encoding_code: ""
            }
        };
        this.setState({ encodingMgmt });
    }

    handleEncodingChange(event: any) {
        const key = event.target.name as string;
        const value = event.target.value;
        const encode = { ...this.state.encodingMgmt.encode, [key]: value };
        const encodingMgmt = { ...this.state.encodingMgmt, encode };
        this.setState({ encodingMgmt });
    }

    handleEncodingDelete(item: any) {
        const encodingMgmt = { ...this.state.encodingMgmt, "encode": item, "delete": true };
        const confirmationModal = {
            show: true,
            description: "Sei sicuro di voler eliminare la seguente codifica?",
            list: `${item.code_type} - ${item.encoding_code}`
        };
        this.setState({ encodingMgmt, confirmationModal });
    }

    deleteEncoding() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.deleteCreditorInstitutionEncoding({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    encodingcode: this.state.encodingMgmt.encode.encoding_code
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            toast.info("Rimozione avvenuta con successo");
                            this.getEncodings(this.state.code);
                        } else if (res.right.status === 409) {
                            this.toastError(res.right.value.detail);

                        } else {
                            this.toastError(res.right.value.title);
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                    })
                    .finally(() => {
                        const confirmationModal = {
                            show: false,
                            description: "",
                            list: ""
                        };
                        const encodingMgmt = {
                            create: false,
                            delete: false,
                            encode: {
                                code_type: "QR_CODE",
                                encoding_code: ""
                            }
                        };
                        this.setState({ confirmationModal, encodingMgmt });
                    });
            });
    }

    hideDeleteModal(status: string) {
        if (status === "ok") {
            if (this.state.encodingMgmt.delete) {
                this.deleteEncoding();
            }
            else if (this.state.stationMgmt.delete) {
                this.deleteStation();
            }
        }
        else {
            const confirmationModal = {
                show: false,
                description: "",
                list: ""
            };
            this.setState({ confirmationModal });
        }
    }

    createStation(): void {
        const stationMgmt = {
            create: true,
            delete: false,
            edit: false,
            station: {
                station_code: "",
                enabled: false,
                version: "",
                application_code: "",
                segregation_code: "",
                aux_digit: "",
                mod4: false,
                broadcast: false,
                aca: true,
                stand_in: true,
            }
        };
        this.setState({ stationMgmt });
    }

    isNotValidNumber(no: number) {
        return no ? no < 0 : no;
    }

    saveStation(): void {
        if (this.isNotValidNumber(this.state.stationMgmt.station.segregation_code) || this.isNotValidNumber(this.state.stationMgmt.station.application_code)) {
            this.toastError("Segregation code e Application code devono assumere valore maggiore o uguale a 0.");
            return;
        }

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.createCreditorInstitutionStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    body: this.state.stationMgmt.station
                }).then((response: any) => {
                    if (response.right.status === 201) {
                        toast.info("Salvataggio avvenuto con successo.");
                        this.getStations(this.state.code);
                        this.discardStation();
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        this.toastError(message);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                });
            });
    }

    editStation(): void {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.updateCreditorInstitutionStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    stationcode: this.state.stationMgmt.station.station_code,
                    body: this.state.stationMgmt.station
                }).then((response: any) => {
                    if (response.right.status === 200) {
                        toast.info("Salvataggio avvenuto con successo.");
                        this.getStations(this.state.code);
                        this.discardStation();
                    } else {
                        const message = ("detail" in response.right.value) ? response.right.value.detail : "Operazione non avvenuta a causa di un errore";
                        toast.error(message, { theme: "colored" });
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                });
            });
    }

    discardStation(): void {
        const stationMgmt = {
            create: false,
            delete: false,
            edit: false,
            station: {}
        };
        this.setState({ stationMgmt });
    }

    debouncedStationOptions = debounce((inputValue, callback) => {
        this.promiseStationOptions(inputValue, callback);
    }, 500);

    promiseStationOptions(inputValue: string, callback: any) {
        const limit = inputValue.length === 0 ? 10 : 99999;
        const code = inputValue.length === 0 ? "" : inputValue;

        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.getStations({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    page: 0,
                    limit,
                    code
                }).then((resp: any) => {
                    if (resp.right.status === 200) {
                        const alreadyAssignedStationIds = this.state.stationList.map((station: any) => station.station_code);
                        const items: Array<any> = [];
                        resp.right.value.stations.filter((retrievedStation: any) => alreadyAssignedStationIds.indexOf(retrievedStation.station_code) === -1)
                            .forEach((retrievedStation: any) => {
                                // eslint-disable-next-line functional/immutable-data
                                items.push({
                                    value: { code: retrievedStation.station_code, version: retrievedStation.version },
                                    label: retrievedStation.station_code,
                                });
                            });
                        callback(items);
                    }
                    else {
                        callback([]);
                    }
                }).catch(() => {
                    toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                    callback([]);
                });
            });
    }

    handleStationChange(event: any) {
        const key = "value" in event ? "station_code" : event.target.name as string;
        const value = "value" in event ? event.value : event.target.value;
        // eslint-disable-next-line functional/no-let
        let station;
        if (key === 'station_code') {
            station = { ...this.state.stationMgmt.station, ['station_code']: value.code, ['version']: value.version };
        }
        else {
            station = { ...this.state.stationMgmt.station, [key]: value };
        }
        const stationMgmt = { ...this.state.stationMgmt, station };
        this.setState({ stationMgmt });
    }

    handleStationEdit(item: any) {
        const stationMgmt = { ...this.state.stationMgmt, "station": item, "edit": true };
        this.setState({ stationMgmt });
    }

    handleStationDelete(item: any) {
        const stationMgmt = { ...this.state.stationMgmt, "station": item, "delete": true };
        const confirmationModal = {
            show: true,
            description: "Sei sicuro di voler eliminare la relazione con la seguente stazione?",
            list: `${item.station_code}`
        };
        this.setState({ stationMgmt, confirmationModal });
    }

    deleteStation() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.deleteCreditorInstitutionStation({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                    creditorinstitutioncode: this.state.code,
                    stationcode: this.state.stationMgmt.station.station_code
                })
                    .then((res: any) => {
                        if (res.right.status === 200) {
                            toast.info("Rimozione avvenuta con successo");
                            this.getStations(this.state.code);
                        } else if (res.right.status === 409) {
                            toast.error(res.right.value.detail, { theme: "colored" });

                        } else {
                            toast.error(res.right.value.title, { theme: "colored" });
                        }
                    })
                    .catch(() => {
                        toast.error("Operazione non avvenuta a causa di un errore", { theme: "colored" });
                    })
                    .finally(() => {
                        const confirmationModal = {
                            show: false,
                            description: "",
                            list: ""
                        };
                        const stationMgmt = {
                            create: false,
                            delete: false,
                            edit: false,
                            station: {
                                station_code: "",
                                enabled: false,
                                version: "",
                                application_code: "",
                                segregation_code: "",
                                aux_digit: "",
                                mod4: false,
                                broadcast: false,
                                aca: true,
                                stand_in: true
                            }
                        };
                        this.setState({ confirmationModal, stationMgmt });
                    });
            });
    }

    getIbanListRender() {
        return this.state.ibanList.map((item: any, index: number) => (
            <tr key={index}>
                <td>{item.iban}</td>
                <td>{item.validity_date.toLocaleDateString()}</td>
                <td>{item.publication_date.toLocaleDateString()}</td>
            </tr>
        ));
    }

    hasIbanWarning(ibanList: any) {
        return Object.keys(ibanList).length === 0 &&
            <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                className="mr-1" />Iban non presenti</Alert>;
    }

    hasIbanContent(ibanList: any) {
        return Object.keys(ibanList).length > 0 &&
            <Table hover responsive size="sm">
                <thead>
                    <tr>
                        <th className="">Iban</th>
                        <th className="">Validità</th>
                        <th className="">Pubblicazione</th>
                    </tr>
                </thead>
                <tbody>
                    {ibanList}
                </tbody>
            </Table>;
    }

    getStationListRender() {
        return this.state.stationList.map((item: any, index: number) => {
            if (this.state.stationMgmt.edit && this.state.stationMgmt.station.station_code === item.station_code) {
                return (
                    <tr key={index}>
                        <td>{item.station_code}</td>
                        <td className="text-center">
                            {item.enabled && <FaCheck className="text-success" />}
                            {!item.enabled && <FaTimes className="text-danger" />}
                        </td>
                        <td className="text-center">
                            <Form.Control name="application_code" placeholder="" type="number" min={0}
                                value={this.state.stationMgmt.station?.application_code}
                                onChange={(e) => this.handleStationChange(e)}
                            />
                        </td>
                        <td className="text-center">
                            <Form.Control name="segregation_code" placeholder="" type="number" min={0}
                                value={this.state.stationMgmt.station?.segregation_code}
                                onChange={(e) => this.handleStationChange(e)}
                            />
                        </td>
                        <td className="text-center">
                            <Form.Control as="select" name="aux_digit" placeholder=""
                                value={this.state.stationMgmt.station?.aux_digit}
                                onChange={(e) => this.handleStationChange(e)}>
                                <option value="null"></option>
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </Form.Control>
                        </td>
                        <td className="text-center">
                            <Form.Control name="version" placeholder="" type="number" min={1} max={2}
                                value={this.state.stationMgmt.station?.version}
                                onChange={(e) => this.handleStationChange(e)}
                            />
                        </td>
                        <td className="text-center">
                            <Form.Control as="select" placeholder="Stato" name="mod4"
                                value={this.state.stationMgmt.station?.mod4}
                                onChange={(e) => this.handleStationChange(e)}>
                                <option value="true">Abilitato</option>
                                <option value="false">Disabilitato</option>
                            </Form.Control>
                        </td>
                        <td className="text-center">
                            <Form.Control as="select" placeholder="Stato" name="broadcast"
                                value={this.state.stationMgmt.station?.broadcast}
                                onChange={(e) => this.handleStationChange(e)}>
                                <option value="true">Abilitato</option>
                                <option value="false">Disabilitato</option>
                            </Form.Control>
                        </td>     
                         <td className="text-center">
                            <Form.Control as="select" placeholder="Stato" name="aca"
                                value={this.state.stationMgmt.station?.aca}
                                onChange={(e) => this.handleStationChange(e)}>
                                <option value="true">Abilitato</option>
                                <option value="false">Disabilitato</option>
                            </Form.Control>
                        </td>    
                         <td className="text-center">
                            <Form.Control as="select" placeholder="Stato" name="stand_in"
                                value={this.state.stationMgmt.station?.stand_in}
                                onChange={(e) => this.handleStationChange(e)}>
                                <option value="true">Abilitato</option>
                                <option value="false">Disabilitato</option>
                            </Form.Control>
                        </td>
                        <td></td>
                    </tr>
                );
            }
            else {
                return (
                    <tr key={index}>
                        <td>{item.station_code}</td>
                        <td className="text-center">
                            {item.enabled && <FaCheck className="text-success" />}
                            {!item.enabled && <FaTimes className="text-danger" />}
                        </td>
                        <td className="text-center">{item.application_code}</td>
                        <td className="text-center">{item.segregation_code}</td>
                        <td className="text-center">{item.aux_digit}</td>
                        <td className="text-center">{item.version}</td>
                        <td className="text-center">
                            {item.mod4 && <FaCheck className="text-success" />}
                            {!item.mod4 && <FaTimes className="text-danger" />}
                        </td>
                        <td className="text-center">
                            {item.broadcast && <FaCheck className="text-success" />}
                            {!item.broadcast && <FaTimes className="text-danger" />}
                        </td>
                        <td className="text-right">
                            <OverlayTrigger placement="top"
                                overlay={<Tooltip id={`tooltip-edit-${index}`}>Modifica</Tooltip>}>
                                <FaEdit role="button" className="mr-3"
                                    onClick={() => this.handleStationEdit(item)} />
                            </OverlayTrigger>
                            <OverlayTrigger placement="top"
                                overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                                <FaTrash role="button" className="mr-3"
                                    onClick={() => this.handleStationDelete(item)} />
                            </OverlayTrigger>
                        </td>
                    </tr>
                );
            }
        });
    }

    getEncodingListRender() {
        return this.state.encodings.map((item: any, index: number) => (
            <tr key={index}>
                <td>
                    {item.code_type}
                    {item.code_type.toUpperCase() === "BARCODE_GS1_128" &&
                        <Badge className="ml-2" variant="danger">DEPRECATO</Badge>}
                </td>
                <td>{item.encoding_code}</td>
                <td className="text-right">
                    <OverlayTrigger placement="top"
                        overlay={<Tooltip id={`tooltip-delete-${index}`}>Elimina</Tooltip>}>
                        <FaTrash role="button" className="mr-3"
                            onClick={() => this.handleEncodingDelete(item)} />
                    </OverlayTrigger>
                </td>
            </tr>
        ));
    }

    hasStationWarning(stationList: any) {
        return (Object.keys(stationList).length === 0 && !this.state.stationMgmt.create) && (
            <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                className="mr-1" />Stazioni non presenti</Alert>
        );
    }

    hasEncodingWarning(encodingList: any) {
        return Object.keys(encodingList).length === 0 && !this.state.encodingMgmt.create &&
            <Alert className={'col-md-12'} variant={"warning"}><FaInfoCircle
                className="mr-1" />Codifiche non presenti</Alert>;
    }

    hasEncodingContent(encodingList: any) {
        return (Object.keys(encodingList).length > 0 || this.state.encodingMgmt.create) &&
            <Table hover responsive size="sm">
                <thead>
                    <tr>
                        <th className="">Tipo</th>
                        <th className="">Codice<span className="text-danger">*</span></th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {encodingList}
                    {
                        this.state.encodingMgmt.create &&
                        <tr>
                            <td>
                                <Form.Control as="select" placeholder="Tipo codifica" name="code_type"
                                    value={this.state.encodingMgmt.encode?.code_type}
                                    onChange={(e) => this.handleEncodingChange(e)}>
                                    <option value="BARCODE_128_AIM">BARCODE_128_AIM</option>
                                    <option value="QR_CODE">QR_CODE</option>
                                </Form.Control>
                            </td>
                            <td>
                                <Form.Control name="encoding_code" placeholder="Codice codifica"
                                    value={this.state.encodingMgmt.encode?.encoding_code}
                                    onChange={(e) => this.handleEncodingChange(e)} />
                            </td>
                            <td />
                        </tr>
                    }
                </tbody>
            </Table>;
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        // create rows for ibans table
        const ibanList = this.getIbanListRender();
        const warningIbanContent = this.hasIbanWarning(ibanList);
        const showIbanContent = this.hasIbanContent(ibanList);

        // create rows for stations table
        const stationList = this.getStationListRender();
        const warningStationContent = this.hasStationWarning(stationList);

        // create rows for encodings table
        const encodingList = this.getEncodingListRender();
        const warningEncodingContent = this.hasEncodingWarning(encodingList);
        const showEncodingContent = this.hasEncodingContent(encodingList);

        return (
            <div className="container-fluid creditor-institutions">
                <div className="row">
                    <div className="col-md-12 mb-5">
                        <Breadcrumb>
                            <Breadcrumb.Item href="/creditor-institutions">Enti Creditori</Breadcrumb.Item>
                            <Breadcrumb.Item active>{this.state.ciName || "-"}</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                    <div className="col-md-12">
                        {isError && (
                            <Alert className={'col-md-12'} variant={'danger'}>
                                Informazioni non disponibili!
                            </Alert>
                        )}
                        {isLoading && (<div className="text-center"><FaSpinner className="spinner" size={28} /></div>)}
                        {
                            !isLoading && (
                                <>
                                    <div className="row">
                                        <div className="col-md-12">
                                            <h2>{this.state.ciName || "-"}</h2>
                                        </div>
                                    </div>
                                    <Card>
                                        <Card.Header>
                                            <h5>Anagrafica</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="row">
                                                <Form.Group controlId="business_name" className="col-md-3">
                                                    <Form.Label>Nome<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="business_name" placeholder=""
                                                        value={this.state.creditorInstitution.business_name}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                                </Form.Group>
                                                <Form.Group controlId="code" className="col-md-4">
                                                    <Form.Label>Codice<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control name="creditor_institution_code" placeholder=""
                                                        value={this.state.creditorInstitution.creditor_institution_code}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                                </Form.Group>
                                                <Form.Group controlId="enabled" className="col-md-3">
                                                    <Form.Label>Stato<span className="text-danger">*</span></Form.Label>
                                                    <Form.Control as="select" name="enabled"
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                                        value={String(this.state.creditorInstitution.enabled)}
                                                    >
                                                        <option value="true">Abilitato</option>
                                                        <option value="false">Non Abilitato</option>
                                                    </Form.Control>
                                                </Form.Group>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="location" className="col-md-4">
                                                    <Form.Label>Indirizzo</Form.Label>
                                                    <Form.Control name="location" placeholder=""
                                                        value={this.state.address?.location}
                                                        onChange={(e) => this.handleChange(e, "address")} />
                                                </Form.Group>
                                                <Form.Group controlId="city" className="col-md-3">
                                                    <Form.Label>Città</Form.Label>
                                                    <Form.Control name="city" placeholder=""
                                                        value={this.state.address?.city}
                                                        onChange={(e) => this.handleChange(e, "address")} />
                                                </Form.Group>
                                                <Form.Group controlId="country_code" className="col-md-2">
                                                    <Form.Label>Provincia</Form.Label>
                                                    <CountryCode name="country_code" obj="address"
                                                        value={this.state.address?.country_code}
                                                        handleChange={(e: any) => this.handleChange(e, "address")} />
                                                </Form.Group>
                                                <Form.Group controlId="cap" className="col-md-2">
                                                    <Form.Label>CAP</Form.Label>
                                                    <Form.Control name="zip_code" placeholder=""
                                                        value={this.state.address?.zip_code}
                                                        onChange={(e) => this.handleChange(e, "address")} />
                                                </Form.Group>
                                                <Form.Group controlId="tax_domicile" className="col-md-4">
                                                    <Form.Label>Domicilio fiscale</Form.Label>
                                                    <Form.Control name="tax_domicile" placeholder=""
                                                        value={this.state.address?.tax_domicile}
                                                        onChange={(e) => this.handleChange(e, "address")} />
                                                </Form.Group>
                                                <Form.Group controlId="cbill" className="col-md-2">
                                                    <Form.Label>CBILL</Form.Label>
                                                    <Form.Control name="cbill_code" placeholder=""
                                                        value={this.state.creditorInstitution.cbill_code}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")} />
                                                </Form.Group>
                                                <Form.Group controlId="psp_payment"
                                                    className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.creditorInstitution.psp_payment === true}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                                        name="psp_payment"
                                                        type={'checkbox'}
                                                        id={'psp-payment'}
                                                        label={'Pagamento PSP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="reporting_ftp"
                                                    className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.creditorInstitution.reporting_ftp === true}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                                        type={'checkbox'}
                                                        id={'reporting-ftp'}
                                                        name="reporting_ftp"
                                                        label={'Rendicontazione FTP'}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId="reporting_zip"
                                                    className="col-md-2 custom-control-box">
                                                    <Form.Check
                                                        custom
                                                        checked={this.state.creditorInstitution.reporting_zip === true}
                                                        onChange={(e) => this.handleChange(e, "creditorInstitution")}
                                                        type={'checkbox'}
                                                        id={'reporting-zip'}
                                                        name="reporting_zip"
                                                        label={'Rendicontazione ZIP'}
                                                    />
                                                </Form.Group>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <Button className="ml-2 float-md-right" variant="secondary"
                                                        onClick={() => {
                                                            this.discard("creditorInstitution");
                                                        }}>Annulla</Button>
                                                    <Button className="float-md-right" onClick={() => {
                                                        this.saveCreditorInstitution();
                                                    }}>Salva</Button>
                                                </div>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <Card>
                                                <Card.Header>
                                                    <h5>Codifiche</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {warningEncodingContent}
                                                    {showEncodingContent}
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            {
                                                                !this.state.encodingMgmt.create &&
                                                                <Button className="float-md-right"
                                                                    onClick={() => {
                                                                        this.createEncoding();
                                                                    }}>
                                                                    Nuovo <FaPlus />
                                                                </Button>
                                                            }
                                                            {
                                                                this.state.encodingMgmt.create &&
                                                                <>
                                                                    <Button className="ml-2 float-md-right"
                                                                        variant="secondary" onClick={() => {
                                                                            this.discardEncoding();
                                                                        }}>Annulla</Button>

                                                                    <Button className="float-md-right" onClick={() => {
                                                                        this.saveEncoding();
                                                                    }}>Salva</Button>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <Card>
                                                <Card.Header>
                                                    <h5>Iban</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {warningIbanContent}

                                                    {showIbanContent}
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="legend">
                                                        <span className="badge badge-info mr-1">Nota:</span>
                                                        Gli Iban si aggiungono tramite l&apos;ICA
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-12 ec-station">
                                            <Card>
                                                <Card.Header>
                                                    <h5>Stazioni</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {warningStationContent}
                                                    {(Object.keys(stationList).length > 0 || this.state.stationMgmt.create) &&
                                                        <Table hover responsive size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th className="fixed-td-width">Codice Stazione</th>
                                                                    <th className="text-center">Abilitata</th>
                                                                    <th className="text-center">Application Code</th>
                                                                    <th className="text-center">Codice Segregazione</th>
                                                                    <th className="text-center">Aux Digit<span className="text-danger">*</span></th>
                                                                    <th className="text-center">Versione</th>
                                                                    <th className="text-center">Modello 4</th>
                                                                    <th className="text-center">Broadcast</th>
                                                                    <th className="text-center">ACA</th>
                                                                    <th className="text-center">Stand In</th>
                                                                    <th></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stationList}
                                                                {
                                                                    this.state.stationMgmt.create &&
                                                                    <tr>
                                                                        <td className="fixed-td-width">
                                                                            <AsyncSelect
                                                                                cacheOptions defaultOptions
                                                                                loadOptions={this.debouncedStationOptions}
                                                                                placeholder="Cerca codice"
                                                                                menuPortalTarget={document.body}
                                                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                                name="station_code"
                                                                                onChange={(e) => this.handleStationChange(e)}
                                                                            />
                                                                        </td>
                                                                        <td className="text-center"></td>
                                                                        <td className="text-center">
                                                                            <Form.Control type="number" name="application_code" placeholder="" min={0}
                                                                                value={this.state.stationMgmt.station?.application_code}
                                                                                onChange={(e) => this.handleStationChange(e)}
                                                                            />
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control type="number" name="segregation_code" placeholder="" min={0}
                                                                                value={this.state.stationMgmt.station?.segregation_code}
                                                                                onChange={(e) => this.handleStationChange(e)}
                                                                            />
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control as="select" name="aux_digit" placeholder=""
                                                                                value={this.state.stationMgmt.station?.aux_digit}
                                                                                onChange={(e) => this.handleStationChange(e)}>
                                                                                <option value="null"></option>
                                                                                <option value="0">0</option>
                                                                                <option value="1">1</option>
                                                                                <option value="2">2</option>
                                                                                <option value="3">3</option>
                                                                            </Form.Control>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control name="version" placeholder="" type="number" min={1} max={2}
                                                                                value={this.state.stationMgmt.station?.version}
                                                                                readOnly />
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control as="select" placeholder="Stato" name="mod4"
                                                                                value={this.state.stationMgmt.station?.mod4}
                                                                                onChange={(e) => this.handleStationChange(e)}>
                                                                                <option value="true">Abilitato</option>
                                                                                <option value="false">Disabilitato</option>
                                                                            </Form.Control>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control as="select" placeholder="Stato" name="broadcast"
                                                                                value={this.state.stationMgmt.station?.broadcast}
                                                                                onChange={(e) => this.handleStationChange(e)}>
                                                                                <option value="true">Abilitato</option>
                                                                                <option value="false">Disabilitato</option>
                                                                            </Form.Control>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control as="select" placeholder="ACA" name="aca"
                                                                                value={this.state.stationMgmt.station?.aca}
                                                                                onChange={(e) => this.handleStationChange(e)}>
                                                                                <option value="true">Abilitato</option>
                                                                                <option value="false">Disabilitato</option>
                                                                            </Form.Control>
                                                                        </td>
                                                                        <td className="text-center">
                                                                            <Form.Control as="select" placeholder="Stand In" name="stand_in"
                                                                                value={this.state.stationMgmt.station?.stand_in}
                                                                                onChange={(e) => this.handleStationChange(e)}>
                                                                                <option value="true">Abilitato</option>
                                                                                <option value="false">Disabilitato</option>
                                                                            </Form.Control>
                                                                        </td>
                                                                        <td></td>
                                                                    </tr>
                                                                }

                                                            </tbody>
                                                        </Table>
                                                    }
                                                </Card.Body>
                                                <Card.Footer>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            {
                                                                !this.state.stationMgmt.create && !this.state.stationMgmt.edit &&
                                                                <Button className="float-md-right"
                                                                    onClick={() => {
                                                                        this.createStation();
                                                                    }}>
                                                                    Nuovo <FaPlus />
                                                                </Button>
                                                            }
                                                            {
                                                                (this.state.stationMgmt.create || this.state.stationMgmt.edit) &&
                                                                <>
                                                                    <Button className="ml-2 float-md-right"
                                                                        variant="secondary" onClick={() => {
                                                                            this.discardStation();
                                                                        }}>Annulla</Button>
                                                                </>
                                                            }
                                                            {
                                                                this.state.stationMgmt.create &&
                                                                <>
                                                                    <Button className="float-md-right" onClick={(event) => {
                                                                        // eslint-disable-next-line functional/immutable-data
                                                                        (event.currentTarget as HTMLButtonElement).disabled = true;
                                                                        this.saveStation();
                                                                    }}>Salva</Button>
                                                                </>
                                                            }
                                                            {
                                                                this.state.stationMgmt.edit &&
                                                                <>
                                                                    <Button className="float-md-right" onClick={() => {
                                                                        this.editStation();
                                                                    }}>Salva</Button>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                </Card.Footer>
                                            </Card>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                    </div>
                </div>

                <ConfirmationModal show={this.state.confirmationModal.show} handleClose={this.hideDeleteModal}>
                    <p>{this.state.confirmationModal.description}</p>
                    <ul>
                        <li>{this.state.confirmationModal.list}</li>
                    </ul>
                </ConfirmationModal>

            </div>
        );
    }
}
