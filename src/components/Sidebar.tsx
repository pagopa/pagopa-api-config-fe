import React from "react";
import {Link} from "react-router-dom";
import {FaCompress, FaExpand} from "react-icons/fa";
import {Accordion} from "react-bootstrap";
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

    componentDidMount(): void {
        // workaround for react according gap
        SidebarItems.forEach(item => {
            if (this.props.history.location.pathname.startsWith(item.route)) {
                const headings: Array<Element> = Array.from(document.getElementsByClassName("navbar-heading"));
                headings.forEach((heading: Element) => {
                    const textContent = heading.textContent;
                    if (textContent !== null && textContent.toLowerCase().indexOf(item.domain) !== -1) {
                        const parent = heading.parentElement;
                        if (parent !== null) {
                            const sibling = parent.nextElementSibling;
                            if (sibling !== null) {
                                sibling.classList.add("show");
                                this.setDomainState(item.domain);
                            }
                        }
                    }
                });
            }
        });
    }

    handleAccordion(activeIndex: any) {
        // workaround for react according gap
        const listGroupList: Array<Element> = Array.from(document.getElementsByClassName("list-group"));
        listGroupList.forEach((listGroup: Element, index: number) => {
            if (activeIndex !== index) {
                const collapse = listGroup.closest(".collapse");
                if (collapse !== null) {
                    collapse.classList.remove("show");
                }
            }
        });
    }

    setDomainState(domain: string) {
        Object.keys(this.state.domains).forEach((key: string) => {
            const domains: any = this.state.domains;
            // eslint-disable-next-line functional/immutable-data
            domains[key] = key === domain;
            this.setState({domains});
        });
    }

    render(): React.ReactNode {
        const location = this.props.history.location;
        const domains: any = this.state.domains;

        function getClass(item: any) {
            return getPath(location.pathname).startsWith(item.route) && getPath(location.pathname).includes(getPath(item.route)) ? "active" : "";
        }

        function getPath(path: string) {
            return path.charAt(0) !== "/" ? "/" + path : path;
        }

        function getCompressionClass(domain: string, expand: boolean) {
            return domains[domain] === expand ? "d-inline" : "d-none";
        }

        function getLink(item: any) {
            return (
                <Link to={item.route} key={item.name} className={`list-group-item-action ${getClass(item)}`}>
                    <span>{item.name}</span>
                </Link>
            );
        }

        return (
            <Accordion onSelect={(activeIndex) => this.handleAccordion(activeIndex)}>
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
                            SidebarItems.filter(item => item.domain === "ec").map((item) => getLink(item))
                        }
                        </div>
                    </Accordion.Collapse>
                </span>
                <span>
                    <Accordion.Toggle as="div" eventKey="1">
                        <span className="navbar-heading" onClick={() => this.setDomainState("psp")}>
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("psp", true)}`} />
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("psp", false)}`} />
                            Dominio PSP
                        </span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="1">
                        <div className="list-group">
                        {
                            SidebarItems.filter(item => item.domain === "psp").map((item) => getLink(item))
                        }
                        </div>
                    </Accordion.Collapse>
                </span>
            </Accordion>

        );

    }
}

