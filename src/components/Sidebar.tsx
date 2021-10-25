import React from "react";
import {Link} from "react-router-dom";
import SidebarItems from "./SidebarItems";

interface IProps {
    history: {
        location: any;
        push(url: string): void;
    };
}

interface IState {}

export default class Sidebar extends React.Component<IProps, IState> {
    render(): React.ReactNode {

        const location = this.props.history.location;

        function getClass(index: number) {
            const activeItem = SidebarItems.findIndex(item => getPath(item.route) === getPath(location.pathname));
            const currentActiveItem = activeItem === -1 ? 0 : activeItem;
            return currentActiveItem === index ? 'active' : '';
        }

        function getPath(path: string) {
            if (path.charAt(0) !== "/") {
                return  "/" + path;
            }
            return path;
        }

        return (
                <div className="list-group">
                    {
                        SidebarItems.map((item, index) => (
                                <Link to={item.route} key={item.name} className={`list-group-item-action ${getClass(index)}`}>
                            <span>
                                {item.name}
                            </span>
                                </Link>
                        ))
                    }
                </div>
        );

    }
}

