import React from "react";
import {Pagination} from "react-bootstrap";


interface IProps {
    pageInfo: {
        page: number;
        limit: number;
        items_found: number;
        total_pages: number;
    };
    // eslint-disable-next-line @typescript-eslint/ban-types
    onPageChanged: Function;
}

interface IState {}

export default class Paginator extends React.Component<IProps, IState> {

    render(): React.ReactNode {
        const pageInfo = this.props.pageInfo;

        const getPrev = () => pageInfo.page === 0 ? 0 : pageInfo.page - 1;
        const getNext = () => pageInfo.page === pageInfo.total_pages ? pageInfo.total_pages : pageInfo.page +1;

        const isFirstDisabled = () => pageInfo.page === 0;
        const isLastDisabled = () => pageInfo.page === pageInfo.total_pages -1;
        const isPrevDisabled = () => pageInfo.page === 0;
        const isNextDisabled = () => pageInfo.page === pageInfo.total_pages -1;

        let items = [];

        if (pageInfo.page === 0) {
            for(let item = pageInfo.page; item < pageInfo.page+3; item++) {
                items.push(
                        <Pagination.Item
                                active={item === pageInfo.page}
                                disabled={item > pageInfo.total_pages -1}
                                onClick={() => this.props.onPageChanged(item)}
                                key={item}>{item+1}</Pagination.Item>
                );
            }
        }
        else {
            items.push(
                    <Pagination.Item
                            onClick={() => this.props.onPageChanged(pageInfo.page-1)}
                            key={pageInfo.page}>{pageInfo.page}</Pagination.Item>
            );
            items.push(
                    <Pagination.Item
                            active={true}
                            onClick={() => this.props.onPageChanged(pageInfo.page)}
                            key={pageInfo.page+1}>{pageInfo.page+1}</Pagination.Item>
            );
            items.push(
                    <Pagination.Item
                            disabled={pageInfo.page+1 > pageInfo.total_pages -1}
                            onClick={() => this.props.onPageChanged(pageInfo.page+1)}
                            key={pageInfo.page+2}>{pageInfo.page+2}</Pagination.Item>
            );
        }

        return (
                <Pagination size="sm" className="float-right">
                    <Pagination.First disabled={isFirstDisabled()} onClick={() => this.props.onPageChanged(0)} />
                    <Pagination.Prev disabled={isPrevDisabled()} onClick={() => this.props.onPageChanged(getPrev())} />
                    {items}
                    <Pagination.Next disabled={isNextDisabled()} onClick={() => this.props.onPageChanged(getNext())} />
                    <Pagination.Last disabled={isLastDisabled()} onClick={() => this.props.onPageChanged(pageInfo.total_pages)} />
                </Pagination>
        );
    }

}
