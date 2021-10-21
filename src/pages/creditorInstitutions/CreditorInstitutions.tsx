import React from 'react';
import {apiClient} from "../../util/apiClient";
import {Table} from "react-bootstrap";
import Paginator from "../../components/Paginator";
import {FaCheck, FaEye, FaTimes, FaTrash} from "react-icons/all";

export default class CreditorInstitutions extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            creditor_institutions: [],
            page_info : {
                page: 0,
                limit: 50,
                items_found: 0,
                total_pages: 1
            },
            isLoading: false
        };
    }

    getPage(page: number) {
        this.setState({isLoading: true});
        apiClient.getCreditorInstitutions({
            ApiKey: "",
            limit: 10,
            page: page
        })
        .then(response => {
            console.log("res", response);
            this.setState({
                creditor_institutions: response.value.value.creditor_institutions,
                page_info: response.value.value.page_info
            });
        })
        .catch(err => {
            console.error("err", err);
        })
        .finally(() => {
            this.setState({isLoading: false});
        });
    }

    componentDidMount(): void {
        this.getPage(0);
    }

    handlePageChange(requestedPage: number) {
        console.log("REQ PAGE", requestedPage);
        this.getPage(requestedPage);
    }

    render(): React.ReactNode {
        const isLoading = this.state.isLoading;
        const pageInfo = this.state.page_info;
        let creditorInstitutions = [];

        this.state.creditor_institutions.map((ci, index) => {
            const code = (
            <tr key={index}>
                <td>{ci.business_name}</td>
                <td>{ci.creditor_institution_code}</td>
                <td className="text-center">
                    {ci.enabled && <FaCheck className="text-success" />}
                    {!ci.enabled && <FaTimes className="text-danger" /> }
                </td>
                <td className="text-right">
                    <FaEye className="mr-3"/>
                    <FaTrash className="mr-3" />
                </td>
            </tr>
            );
            creditorInstitutions.push(code);
        })

        return (
                <div className="container-fluid creditor-institutions">
                    <div className="row">
                        <div className="col-md-12 mb-5">
                            <h2>EntiCreditori</h2>
                        </div>
                        <div className="col-md-12">
                        {isLoading &&  ( <p>Loading ...</p> )}
                        {
                            !isLoading && (
                                <>
                                    <Table hover responsive size="sm" >
                                        <thead>
                                        <tr>
                                            <th className="fixed-td-width">Name</th>
                                            <th className="fixed-td-width">Code</th>
                                            <th className="text-center">Enabled</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {creditorInstitutions}
                                        </tbody>
                                    </Table>

                                    <Paginator pageInfo={pageInfo} onPageChanged={this.handlePageChange.bind(this)} />
                                </>
                            )
                        }
                        </div>
                    </div>
                </div>
        );
    }
}
