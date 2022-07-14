import React from "react";
import {Link} from "react-router-dom";
import {FaCompress, FaExpand, FaHome} from "react-icons/fa";
import {Accordion} from "react-bootstrap";
import {toast} from "react-toastify";
import {MsalContext} from "@azure/msal-react";
import {loginRequest} from "../authConfig";
import {apiClient} from "../util/apiClient";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import packageJson from "../../package.json";
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
        configuration: boolean;
        batchoperation: boolean;
    };
    be_version: string;
}

export default class Sidebar extends React.Component<IProps, IState> {
    static contextType = MsalContext;

    constructor(props: IProps) {
        super(props);

        this.state = {
            domains: {
                ec: true,
                psp: false,
                configuration: false,
                batchoperation: false
            },
            be_version: ''
        };

        this.getInfo = this.getInfo.bind(this);

    }

    componentDidMount(): void {
        this.getInfo();

        // workaround for react according gap
        SidebarItems.forEach(item => {
            if (this.props.history.location.pathname.split("/")[1] === item.route.substring(1)) {
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

    getInfo() {
        this.context.instance.acquireTokenSilent({
            ...loginRequest,
            account: this.context.accounts[0]
        })
            .then((response: any) => {
                apiClient.healthCheck({
                    Authorization: `Bearer ${response.idToken}`,
                    ApiKey: "",
                }).then((response: any) => {
                    this.setState({
                        be_version: response.right.value.version,
                    });
                })
                    .catch(() => {
                        toast.error("Problema nel recuperare le info del server", {theme: "colored"});
                    });
            });
    }


    render(): React.ReactNode {
        const location = this.props.history.location;

        const domains: any = this.state.domains;

        function getClass(item: any) {
            if (item.route.includes("icas")) {
                return getPath(location.pathname).substring(1) === item.route.substring(1) ? "active" : "";
            } else {
                return getPath(location.pathname).split("/")[1] === item.route.substring(1) &&
                getPath(location.pathname).includes(getPath(item.route)) ? "active" : "";
            }
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
            <>
                <Link to={"/"} key={"home"} className={`list-group-item-action `}>
                    <div className="ml-1">
                        <FaHome></FaHome> <span className="ml-1">Home</span>
                    </div>
                </Link>
                <Accordion onSelect={(activeIndex) => this.handleAccordion(activeIndex)}>
                <span>
                    <Accordion.Toggle as="div" eventKey="0">
                        <span className="navbar-heading" onClick={() => this.setDomainState("ec")}>
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("ec", true)}`}/>
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("ec", false)}`}/>
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
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("psp", true)}`}/>
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("psp", false)}`}/>
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
                    <span>
                    <Accordion.Toggle as="div" eventKey="2">
                        <span className="navbar-heading" onClick={() => this.setDomainState("configuration")}>
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("configuration", true)}`}/>
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("configuration", false)}`}/>
                            Configuration
                        </span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="2">
                        <div className="list-group">
                        {
                            SidebarItems.filter(item => item.domain === "configuration").map((item) => getLink(item))
                        }
                        </div>
                    </Accordion.Collapse>
                </span>
                    <span>
                    <Accordion.Toggle as="div" eventKey="3">
                        <span className="navbar-heading" onClick={() => this.setDomainState("batchoperation")}>
                            <FaExpand className={`ml-2 mr-2 ${getCompressionClass("batchoperation", true)}`}/>
                            <FaCompress className={`ml-2 mr-2 ${getCompressionClass("batchoperation", false)}`}/>
                            Operazioni Massive
                        </span>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="3">
                        <div className="list-group">
                        {
                            SidebarItems.filter(item => item.domain === "batchoperation").map((item) => getLink(item))
                        }
                        </div>
                    </Accordion.Collapse>
                </span>
                </Accordion>
                <div className={"info-box"}>
                    <div>versione FE {packageJson.version} </div>
                    <div>versione BE {this.state.be_version}</div>
                    Made with ❤️ by PagoPA S.p.A.
                </div>
            </>
        );
    }
}

