import React from "react";
import {FaSort, FaSortDown, FaSortUp} from "react-icons/fa";

interface IProps {
    currentOrderBy: string;
    currentOrdering: string;
    orderBy: string;
    ordering: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    handleOrder: Function;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {}

export default class Ordering extends React.Component<IProps, IState> {
    private sortingMngmt: Array<string>;

    constructor(props: IProps) {
        super(props);

        this.sortingMngmt = ["ASC", "DESC"];

        this.handleSort = this.handleSort.bind(this);
    }

    handleSort() {
        // eslint-disable-next-line functional/immutable-data
        this.sortingMngmt.splice(this.sortingMngmt.indexOf(this.props.currentOrdering), 1);
        this.props.handleOrder(this.props.orderBy, this.sortingMngmt[0]);
    }

    render(): React.ReactNode {
        return (
                <>
                    {
                        this.props.orderBy !== this.props.currentOrderBy &&
						<FaSort className={"mr-2"} onClick={() => this.handleSort()} />
                    }
                    {
                        this.props.orderBy === this.props.currentOrderBy && "DESC" === this.props.currentOrdering &&
						<FaSortUp className={"mr-2"} onClick={() => this.handleSort()} />
                    }
                    {
                        this.props.orderBy === this.props.currentOrderBy && "ASC" === this.props.currentOrdering &&
						<FaSortDown className={"mr-2"} onClick={() => this.handleSort()} />
                    }
                </>
        );
    }
}
