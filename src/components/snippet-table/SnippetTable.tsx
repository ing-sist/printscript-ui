import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Select,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  FormControl,
  InputLabel,
  TableSortLabel
} from "@mui/material";
import {AddSnippetModal} from "./AddSnippetModal.tsx";
import {useRef, useState} from "react";
import {Add, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow.tsx";
import {CreateSnippetWithLang, getFileLanguage, Snippet} from "../../utils/snippet.ts";
import {usePaginationContext} from "../../contexts/paginationContext.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";
import {SnippetFilterDTO} from "../../api/types";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (snippetName: string) => void;
  filters?: SnippetFilterDTO;
  handleFilterChange?: (filters: SnippetFilterDTO) => void;
}

export const SnippetTable = (props: SnippetTableProps) => {
  const {snippets, handleClickSnippet, loading, handleSearchSnippet, filters, handleFilterChange} = props;
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverMenuOpened, setPopoverMenuOpened] = useState(false)
  const [snippet, setSnippet] = useState<CreateSnippetWithLang | undefined>()

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {page, page_size: pageSize, count, handleChangePageSize, handleGoToPage} = usePaginationContext()
  const {createSnackbar} = useSnackbarContext()
  const {data: fileTypes} = useGetFileTypes();

  const handleLoadSnippet = async (target: EventTarget & HTMLInputElement) => {
    const files = target.files
    if (!files || !files.length) {
      createSnackbar('error',"Please select at leat one file")
      return
    }
    const file = files[0]
    const splitName = file.name.split(".")
    const fileType = getFileLanguage(fileTypes ?? [], splitName.at(-1))
    if (!fileType) {
      createSnackbar('error', `File type ${splitName.at(-1)} not supported`)
      return
    }
    file.text().then((text) => {
      setSnippet({
        name: splitName[0],
        content: text,
        language: fileType.language,
        extension: fileType.extension,
        description: "",
        version: "1.1"
      })
    }).catch(e => {
      console.error(e)
    }).finally(() => {
      setAddModalOpened(true)
      target.value = ""
    })
  }

  function handleClickMenu() {
    setPopoverMenuOpened(false)
  }

  const handleSort = (field: string) => {
    if (handleFilterChange) {
      const currentSort = filters?.sort ?? "";
      const currentDir = filters?.dir ?? "ASC";
      const isAsc = currentSort === field && currentDir === "ASC";
      handleFilterChange({
        ...filters,
        sort: field,
        dir: isAsc ? "DESC" : "ASC"
      });
    }
  };

  return (
      <>
        <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box sx={{background: 'white', width: '30%', display: 'flex', alignItems: 'center', borderRadius: 1, p: 0.5}}>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder="Search Snippet"
                inputProps={{'aria-label': 'search'}}
                onChange={e => handleSearchSnippet(e.target.value)}
            />
            <IconButton type="button" sx={{p: '10px'}} aria-label="search">
              <Search/>
            </IconButton>
          </Box>
          
          {handleFilterChange && (
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{minWidth: 120}}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters?.mode || 'ALL'}
                  label="Type"
                  onChange={(e) => handleFilterChange({...filters, mode: e.target.value})}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="OWNED">My Snippets</MenuItem>
                  <MenuItem value="SHARED">Shared with me</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{minWidth: 120}}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={filters?.language || ''}
                  label="Language"
                  onChange={(e) => handleFilterChange({...filters, language: e.target.value})}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  {fileTypes?.map(ft => (
                    <MenuItem key={ft.language} value={ft.language}>{ft.language}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{minWidth: 120}}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters?.conformance || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange({...filters, conformance: e.target.value})}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="COMPLIANT">Compliant</MenuItem>
                  <MenuItem value="NON_COMPLIANT">Non Compliant</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          <Button ref={popoverRef} variant="contained" disableRipple sx={{boxShadow: 0}}
                  onClick={() => setPopoverMenuOpened(true)}>
            <Add/>
            Add Snippet
          </Button>
        </Box>
        <Table size="medium" sx={{borderSpacing: "0 10px", borderCollapse: "separate"}}>
          <TableHead>
            <TableRow sx={{fontWeight: 'bold'}}>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                    active={filters?.sort === 'name'}
                    direction={filters?.sort === 'name' && filters?.dir === 'DESC' ? 'desc' : 'asc'}
                    onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                    active={filters?.sort === 'language'}
                    direction={filters?.sort === 'language' && filters?.dir === 'DESC' ? 'desc' : 'asc'}
                    onClick={() => handleSort('language')}
                >
                  Language
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>Author</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                    active={filters?.sort === 'conformance'}
                    direction={filters?.sort === 'conformance' && filters?.dir === 'DESC' ? 'desc' : 'asc'}
                    onClick={() => handleSort('conformance')}
                >
                  Conformance
                </TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>{
            loading ? (
                <>
                  {Array.from({length: 10}).map((_, index) => (
                      <LoadingSnippetRow key={index}/>
                  ))}
                </>
            ) : (
                <>
                  {
                      snippets && snippets.map((snippet) => (
                          <SnippetRow data-testid={"snippet-row"}
                                      onClick={() => handleClickSnippet(snippet.id)} key={snippet.id} snippet={snippet}/>
                      ))
                  }
                </>
            )
          }
          </TableBody>
          <TablePagination count={count} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, page) => handleGoToPage(page)}
                           onRowsPerPageChange={e => handleChangePageSize(Number(e.target.value))}/>
        </Table>
        <AddSnippetModal defaultSnippet={snippet} open={addModalOpened}
                         onClose={() => setAddModalOpened(false)}/>
        <Menu anchorEl={popoverRef.current} open={popoverMenuOpened} onClick={handleClickMenu}>
          <MenuItem onClick={() => setAddModalOpened(true)}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef?.current?.click()}>Load snippet from file</MenuItem>
        </Menu>
        <input hidden type={"file"} ref={inputRef} multiple={false} data-testid={"upload-file-input"}
               onChange={e => handleLoadSnippet(e?.target)}/>
      </>
  )
}


export const StyledTableCell = styled(TableCell)`
    border: 0;
    align-items: center;
`
