import Pagination from "@mui/material/Pagination"
import Typography from "@mui/material/Typography"
import Select from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import { ChangeEvent } from "react"
import styles from './TasksPagination.module.css'

type Props = {
  totalCount: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
}

export const TasksPagination = ({ totalCount, page, setPage, pageSize, setPageSize }: Props) => {
  const changePage = (_: ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const changePageSize = (event: any) => {
    setPageSize(Number(event.target.value))
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Typography variant="caption">Rows:</Typography>
        <Select value={pageSize} variant="standard" onChange={changePageSize} size="small">
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
        </Select>
      </div>

      <div className={styles.center}>
        <Pagination count={totalPages} page={page} onChange={changePage} shape="rounded" color="primary" size="small" />
      </div>

      <div className={styles.right}>
        <Typography variant="caption">Total: {totalCount}</Typography>
      </div>
    </div>
  )
}
