import React from 'react';
import shallowEqual from 'shallowequal';

import BaseHeaderCell from './HeaderCell';
import getScrollbarSize from './getScrollbarSize';
import { getColumn, getSize, isFrozen } from './ColumnUtils';
import SortableHeaderCell, { DEFINE_SORT } from './common/cells/headerCells/SortableHeaderCell';
import FilterableHeaderCell from './common/cells/headerCells/FilterableHeaderCell';
import HeaderCellType from './HeaderCellType';
import { HeaderRowType } from './common/constants';

import PropTypes from 'prop-types';

const HeaderRowStyle = {
  overflow: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.number,
  position: PropTypes.string
};

export default class HeaderRow extends React.Component {
  static displayName = 'HeaderRow';

  static propTypes = {
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.number.isRequired,
    columns: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    onColumnResize: PropTypes.func,
    onSort: PropTypes.func.isRequired,
    onColumnResizeEnd: PropTypes.func,
    style: PropTypes.shape(HeaderRowStyle),
    sortColumn: PropTypes.string,
    sortDirection: PropTypes.oneOf(Object.keys(DEFINE_SORT)),
    cellRenderer: PropTypes.func,
    headerCellRenderer: PropTypes.func,
    filterable: PropTypes.bool,
    onFilterChange: PropTypes.func,
    resizing: PropTypes.object,
    onScroll: PropTypes.func,
    rowType: PropTypes.string,
    draggableHeaderCell: PropTypes.func,
    onHeaderDrop: PropTypes.func
  };

  cells = [];

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.width !== this.props.width
      || nextProps.height !== this.props.height
      || nextProps.columns !== this.props.columns
      || !shallowEqual(nextProps.style, this.props.style)
      || this.props.sortColumn !== nextProps.sortColumn
      || this.props.sortDirection !== nextProps.sortDirection
    );
  }

  getHeaderCellType = (column) => {
    if (column.filterable) {
      if (this.props.filterable) return HeaderCellType.FILTERABLE;
    }

    if (column.sortable && column.rowType !== HeaderRowType.FILTER) return HeaderCellType.SORTABLE;

    return HeaderCellType.NONE;
  };

  getFilterableHeaderCell = (column) => {
    const FilterRenderer = column.filterRenderer || FilterableHeaderCell;
    return <FilterRenderer {...this.props} onChange={this.props.onFilterChange} />;
  };

  getSortableHeaderCell = (column) => {
    const sortDirection = this.props.sortColumn === column.key ? this.props.sortDirection : DEFINE_SORT.NONE;
    const sortDescendingFirst = column.sortDescendingFirst === undefined ? false : column.sortDescendingFirst;
    return <SortableHeaderCell columnKey={column.key} onSort={this.props.onSort} sortDirection={sortDirection} sortDescendingFirst={sortDescendingFirst} headerRenderer={column.headerRenderer} />;
  };

  getHeaderRenderer = (column) => {
    if (column.headerRenderer && !column.sortable && !this.props.filterable) {
      return column.headerRenderer;
    }
    const headerCellType = this.getHeaderCellType(column);
    switch (headerCellType) {
      case HeaderCellType.SORTABLE:
        return this.getSortableHeaderCell(column);
      case HeaderCellType.FILTERABLE:
        return this.getFilterableHeaderCell(column);
      default:
        return undefined;
    }
  };

  getStyle = () => {
    return {
      overflow: 'hidden',
      width: '100%',
      height: this.props.height,
      position: 'absolute'
    };
  };

  getCells = () => {
    const cells = [];
    const frozenCells = [];
    const { columns, rowType } = this.props;

    for (let i = 0, len = getSize(columns); i < len; i++) {
      const column = { rowType, ...getColumn(columns, i) };
      const _renderer = column.key === 'select-row' && rowType === HeaderRowType.FILTER ? <div /> : this.getHeaderRenderer(column);

      const cell = (
        <BaseHeaderCell
          key={column.key}
          ref={(node) => this.cells[i] = node}
          column={column}
          rowType={rowType}
          height={this.props.height}
          renderer={_renderer}
          resizing={this.props.resizing === column}
          onResize={this.props.onColumnResize}
          onResizeEnd={this.props.onColumnResizeEnd}
          onHeaderDrop={this.props.onHeaderDrop}
          draggableHeaderCell={this.props.draggableHeaderCell}
        />
      );

      if (isFrozen(column)) {
        frozenCells.push(cell);
      } else {
        cells.push(cell);
      }
    }

    return cells.concat(frozenCells);
  };

  setScrollLeft = (scrollLeft) => {
    this.props.columns.forEach((column, i) => {
      if (isFrozen(column)) {
        this.cells[i].setScrollLeft(scrollLeft);
      } else if (this.cells[i] && this.cells[i].removeScroll) {
        this.cells[i].removeScroll();
      }
    });
  };

  render() {
    const cellsStyle = {
      width: this.props.width ? this.props.width + getScrollbarSize() : '100%',
      height: this.props.height,
      whiteSpace: 'nowrap',
      overflowX: 'hidden',
      overflowY: 'hidden'
    };

    const { width, height, style, onScroll } = this.props;
    const cells = this.getCells();
    return (
      <div
        width={width}
        height={height}
        style={style}
        onScroll={onScroll}
        className="react-grid-HeaderRow"
      >
        <div style={cellsStyle}>
          {cells}
        </div>
      </div>
    );
  }
}
