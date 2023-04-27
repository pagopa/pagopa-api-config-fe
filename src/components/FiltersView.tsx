import React from "react";
import {Form} from "react-bootstrap";
import debounce from "lodash.debounce";
import {FaFilter} from "react-icons/fa";


interface IProps {
    configuration: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
    onFilter: (...args: any) => any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    code: string;
    name: string;
}

export default class FiltersView extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
                <div className={"row mb-5"}>
                    <div className="d-flex ml-3 align-items-center">
                        <FaFilter />
                    </div>
                    {
                        this.props.configuration.aux_digit?.visible && (
                        <div className="col-md-4 align-items-center">
                            <Form.Control name="filter_aux_digit" placeholder={this.props.configuration.aux_digit.placeholder}
                                          onChange={event => this.onFilter({
                                              ...this.state,
                                              aux_digit: event.target.value
                                          })}/>
                        </div>
                    )
                    }

                    {
                        this.props.configuration.application_code?.visible && (
                            <div className="col-md-4 align-items-center">
                                <Form.Control name="filter_application_code" placeholder={this.props.configuration.application_code.placeholder}
                                              onChange={event => this.onFilter({
                                                  ...this.state,
                                                  application_code: event.target.value
                                              })}/>
                            </div>
                        )
                    }

                    {
                        this.props.configuration.segregation_code?.visible && (
                            <div className="col-md-4 align-items-center">
                                <Form.Control name="filter_segregation_code" placeholder={this.props.configuration.segregation_code.placeholder}
                                              onChange={event => this.onFilter({
                                                  ...this.state,
                                                  segregation_code: event.target.value
                                              })}/>
                            </div>
                        )
                    }
                </div>
        );
    }

    private onFilter = debounce(filter => {
        this.setState(filter);
        this.props.onFilter(filter);
    }, 500);

}

