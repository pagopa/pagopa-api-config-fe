import React from "react";
import {Alert, Breadcrumb, Form} from "react-bootstrap";
import {FaSpinner} from "react-icons/fa";
import {apiClient} from "../../util/apiClient";

interface IProps {
    match: {
        params: object;
    };
}

interface IState {
    isError: boolean;
    isLoading: boolean;
    code: string;
    creditorInstitution: any;
}

export default class CreditorInstitution extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            isError: false,
            isLoading: true,
            code: "",
            creditorInstitution: {}
        };
    }

    componentDidMount(): void {
        const code = this.props.match.params.code;
        // this.setState({code: useParams()});

        apiClient.getCreditorInstitution({
            ApiKey: "",
            creditorinstitutioncode: code
        }).then((response: any) => {
            if (response.value.status === 200) {
                this.setState({creditorInstitution: response.value.value});
            }
            else {
                this.setState({isError: true});
            }
            console.log("CODE", response);
        })
        .catch((err: any) => {
            console.error("ERR", err);
            this.setState({isError: true});
        })
        .finally(() => this.setState({isLoading: false}));
    }

    render(): React.ReactNode {
        const isError = this.state.isError;
        const isLoading = this.state.isLoading;

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <Breadcrumb>
                                <Breadcrumb.Item href="/creditor-institutions">Enti Creditori</Breadcrumb.Item>
                                <Breadcrumb.Item active>{this.state.creditorInstitution.business_name}</Breadcrumb.Item>
                            </Breadcrumb>
                        </div>
                        <div className="col-md-12">
                            {isError &&  (
                                    <Alert className={'col-md-12'} variant={'danger'}>
                                        Informazioni non disponibili!
                                    </Alert>
                            )}
                            {isLoading &&  ( <FaSpinner className="spinner" /> )}
                            {
                                !isLoading && (
                                        <>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <h2>{this.state.creditorInstitution.business_name}</h2>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <Form.Group controlId="code">
                                                    <Form.Label>Codice</Form.Label>
                                                    <Form.Control type="code" placeholder="codice" value={this.state.creditorInstitution.creditor_institution_code} readOnly />
                                                </Form.Group>

                                                <Form.Group controlId="code">
                                                    <Form.Label>Codice</Form.Label>
                                                    <Form.Control type="code" placeholder="codice" value={this.state.creditorInstitution.creditor_institution_code} readOnly />
                                                </Form.Group>
                                            </div>
                                        </>
                                )
                            }
                        </div>
                    </div>
                </div>
        );
    }
}
