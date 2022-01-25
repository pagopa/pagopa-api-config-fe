import React from "react";
import {Card, Form} from "react-bootstrap";
import debounce from "lodash.debounce";


interface IProps {
    showName: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    onFilter: (...args: any) => any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    code: string;
    name: string;
}

export default class Filters extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    render(): React.ReactNode {
        return (
            <div>
                <Card>
                    <Card.Header>
                        <h5>Filtri</h5>
                    </Card.Header>
                    <Card.Body className="d-flex p-2">
                        {this.props.showName && (
                            <Form.Group id="filters" controlId="filter_name" className={"p-2"}>
                                <Form.Label>Nome</Form.Label>
                                <Form.Control name="filter_name" placeholder=""
                                              onChange={event => this.onFilter({
                                                  ...this.state,
                                                  name: event.target.value
                                              })}/>
                            </Form.Group>
                        )}

                        <Form.Group controlId="filter_code" className={"p-2"}>
                            <Form.Label>Codice</Form.Label>
                            <Form.Control name="filter_code" placeholder=""
                                          onChange={event => this.onFilter({
                                              ...this.state,
                                              code: event.target.value
                                          })}/>
                        </Form.Group>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    private onFilter = debounce(filter => {
        this.setState(filter);
        this.props.onFilter(filter);
    }, 500);

}

