import React, {useState, useEffect} from 'react'
import { useTable, useFilters, useGlobalFilter, useSortBy, usePagination} from 'react-table'
import matchSorter from 'match-sorter'
import makeData from './makeData'
import 'materialize-css/dist/css/materialize.min.css';
import './App.css'

function useWindowSize() {
  const isClient = typeof window === "object";

  
  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return false;
    }

    function handleResize() {
      setWindowSize(getSize());
    }

    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
    />
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

// Our table component
function Table({ 
  columns, 
  data, 
  fetchData,
  loading,
  pageCount: controlledPageCount, 
}) {
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    pageOptions,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      filterTypes,
      initialState: { pageIndex: 0 },
      manualPagination: true,
      pageCount: controlledPageCount,
    },
    useFilters, // useFilters!
    useGlobalFilter, // useGlobalFilter!
    useSortBy, // userSortBy!
    usePagination, //userPagination!
  )
  // Listen for changes in pagination and use the state to fetch our new data
  useEffect(() => {
    fetchData({ pageIndex, pageSize })
  }, [fetchData, pageIndex, pageSize])
  // console.log(headerGroup.headers)
  const [slider, setSlider] = useState(false);
  const size = useWindowSize();
  return (
    <>
      <div className="row">
        <nav className="light-blue">
          <a
            href="#"
            className="sidenav-trigger"
            onClick={() => setSlider(s => !s)}
          >
            <i className="material-icons">menu</i>
          </a>
        </nav>
        <div 
          className="sidenav-overlay" 
          onClick={() => setSlider(s => !s)}
          style={{
            display: slider && size.width < 835 ? "block" : "none",
            opacity: "1"
          }}/>
        <div 
          className="mobile-header sidenav" 
          style={{
          transform: slider || size.width > 835 ? "translateX(0%)" : "",
          transitionProperty: "transform",
          transitionDuration: ".25s"
        }}>
          {headerGroups.map(headerGroup => (
            <div className="sort-header" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <div
                  className=
                  {column.isSorted
                    ? column.isSortedDesc
                      ? "sorting_desc"
                      : "sorting_asc"
                    : "sorting"
                  } 
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                >
                  {column.render('Header')}
                </div>
              ))}
            </div>
          ))}
          {headerGroups.map(headerGroup => (
            <div className="filter-header" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <div>{column.canFilter ? column.render('Filter') : null}</div>
              ))}
            </div>
          ))}
        </div>

        <div className="col s12">
          <div className="material-table card">
            <div className="dataTables_wrapper no-footer">
              
              <table className="dataTable no-footer" {...getTableProps()}>
                <thead>
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map(column => (
                        <th 
                          className=
                          {column.isSorted
                            ? column.isSortedDesc
                              ? "sorting_desc"
                              : "sorting_asc"
                            : "sorting"
                          }
                        >
                          <div className="headername"
                          {...column.getHeaderProps(column.getSortByToggleProps())}>
                            {column.render('Header')}
                          </div>
                          <div>{column.canFilter ? column.render('Filter') : null}</div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row, i) => {
                    prepareRow(row)
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map(cell => {
                          return <td data-label={cell.column.Header} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                        })}
                      </tr>
                    )
                  })}
                  <tr>
                    {loading ? (
                      // Use our custom loading state to show a loading indicator
                      <td colSpan="10000">Loading...</td>
                    ) : (
                        <td colSpan="10000">
                          Showing {page.length} of {controlledPageCount * pageSize}{' '}
                        results
                        </td>
                      )}
                  </tr>
                </tbody>
              </table>
              <br />
              <div className="table-footer">
                <div className="dataTables_length">            
                  <label>
                    <span>Rows per page:</span>
                    <select
                      className="browser-default"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value))
                      }}
                    >
                      {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                
                <div className="dataTables_info">
                  Page {pageIndex + 1} of {pageOptions.length}
                </div>

                <div className="dataTables_paginate paging_simple_numbers">
                  <ul className="material-pagination">
                    <li className="paginate_button previous">
                      <a
                        onClick={(e) => {e.preventDefault(); previousPage();}} 
                      >
                        <i className="material-icons">chevron_left</i>
                      </a>
                    </li>
                    <li className="paginate_button next">
                      <a 
                        onClick={(e) => {e.preventDefault(); nextPage();}}
                      >
                        <i className="material-icons">chevron_right</i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function filterGreaterThan(rows, id, filterValue) {
  return rows.filter(row => {
    const rowValue = row.values[id]
    return rowValue >= filterValue
  })
}
filterGreaterThan.autoRemove = val => typeof val !== 'number'
const serverData = makeData(10000)

function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'FirstName',
        accessor: 'firstName',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
      {
        Header: 'LastName',
        accessor: 'lastName',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
      {
        Header: 'URL',
        accessor: 'url',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
      {
        Header: 'Age',
        accessor: 'age',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
      {
        Header: 'Visits',
        accessor: 'visits',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Filter: DefaultColumnFilter,
        filter: 'includes',
      },
      {
        Header: 'Profile Progress',
        accessor: 'progress',
        Filter: DefaultColumnFilter,
        filter: 'equals',
      },
    ],
    []
  )

  // We'll start our table without any data
  const [data, setData] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [pageCount, setPageCount] = React.useState(0)
  const fetchIdRef = React.useRef(0)

  const fetchData = React.useCallback(({ pageSize, pageIndex }) => {
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setTimeout(() => {
      // Only update the data if this is the latest fetch
      if (fetchId === fetchIdRef.current) {
        const startRow = pageSize * pageIndex
        const endRow = startRow + pageSize
        setData(serverData.slice(startRow, endRow))
        setPageCount(Math.ceil(serverData.length / pageSize))
        setLoading(false)
      }
    }, 1000)
  }, [])

  return (
      <Table 
        columns={columns} 
        data={data}
        fetchData={fetchData}
        loading={loading}
        pageCount={pageCount} 
      />
  )
}

export default App
