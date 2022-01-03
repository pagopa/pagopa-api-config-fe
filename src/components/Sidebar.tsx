import React from "react";
import {Link} from "react-router-dom";
import {FaCompress, FaExpand} from "react-icons/fa";
import {Accordion, Button} from "react-bootstrap";
import SidebarItems from "./SidebarItems";

interface IProps {
    history: {
        location: {
            pathname: string;
        };
        push(url: string): void;
    };
}

interface IState {
    domains: {
        ec: boolean;
        psp: boolean;
    };
}

export default class Sidebar extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            domains: {
                ec: true,
                psp: false
            }
        };
    }

    setDomainState(domain: string) {
        // eslint-disable-next-line functional/no-let
        let domains = this.state.domains;
        domains[domain] = !domains[domain];
        this.setState({domains});
    }

    render(): React.ReactNode {

        const location = this.props.history.location;
        const domains = this.state.domains;

        function getClass(domain: string, index: number) {
            const activeItem = SidebarItems.findIndex(item => item.domain === domain && getPath(location.pathname).includes(getPath(item.route)));
            const currentActiveItem = activeItem === -1 ? 0 : activeItem;
            return currentActiveItem === index ? 'active' : '';
        }

        function getPath(path: string) {
            if (path.charAt(0) !== "/") {
                return  "/" + path;
            }
            return path;
        }

        function getCompressionClass(domain: string, expand: boolean) {
            return domains[domain] === expand ? "d-inline" : "d-none";
        }

        return (

            <Accordion defaultActiveKey="0">
                <span>
                    <Accordion.Toggle as="div" eventKey="0">
                        <span className="navbar-heading" onClick={() => this.setDomainState("ec")}>
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("ec", true)}`} />
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("ec", false)}`} />
                            Dominio EC
                        </span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                        <div className="list-group">
                            {
                                SidebarItems.filter(item => item.domain === "ec").map((item, index) =>
                                        <Link to={item.route} key={item.name} className={`list-group-item-action ${getClass( "ec", index)}`}>
                                            <span>{item.name}</span>
                                        </Link>
                                )
                            }
                        </div>
                    </Accordion.Collapse>
                </span>
                <span>
                    <Accordion.Toggle as="div" eventKey="1">
                        <span className="navbar-heading">
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("psp", true)}`} />
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("psp", false)}`} />
                            Dominio PSP
                        </span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="1">
                        <div className="list-group">
                            {
                                SidebarItems.filter(item => item.domain === "psp").map((item, index) =>
                                        <Link to={item.route} key={item.name} className={`list-group-item-action ${getClass( "psp", index)}`}>
                                            <span>{item.name}</span>
                                        </Link>
                                )
                            }
                        </div>
                    </Accordion.Collapse>
                </span>
            </Accordion>

        );

    }
}

