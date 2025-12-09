import {withNavbar} from "../components/navbar/withNavbar.tsx";
import {SnippetTable} from "../components/snippet-table/SnippetTable.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {SnippetDetail} from "./SnippetDetail.tsx";
import {Box, Button, Drawer} from "@mui/material";
import {useGetSnippets} from "../utils/queries.tsx";
import {usePaginationContext} from "../contexts/paginationContext.tsx";
import useDebounce from "../hooks/useDebounce.ts";
import {SnippetFilterDTO} from "../api/types";
import {BACKEND_URL} from "../utils/constants.ts";
import {useSnackbarContext} from "../contexts/snackbarContext.tsx";

const HomeScreen = () => {
  const {id: paramsId} = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [filters, setFilters] = useState<SnippetFilterDTO>({});
  const [snippetId, setSnippetId] = useState<string | null>(null)
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);
  const {page, page_size, count, handleChangeCount} = usePaginationContext()
  const {data, isLoading} = useGetSnippets(page, page_size, snippetName, filters)
  const {createSnackbar} = useSnackbarContext();

  useEffect(() => {
    if (data?.count && data.count != count) {
      handleChangeCount(data.count)
    }
  }, [count, data?.count, handleChangeCount]);


  useEffect(() => {
    if (paramsId) {
      setSnippetId(paramsId);
    }
  }, [paramsId]);

  const handleCloseModal = () => setSnippetId(null)

  // DeBounce Function
  useDebounce(() => {
        setSnippetName(
            searchTerm
        );
      }, [searchTerm], 800
  );

  const handleSearchSnippet = (snippetName: string) => {
    setSearchTerm(snippetName);
  };

  const handleHealthError = async () => {
    setHealthCheckLoading(true);
    const url = `${BACKEND_URL}/health/error`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Health error endpoint returned an error');
      }
      createSnackbar('success', 'Health error endpoint called successfully');
    } catch (error) {
      console.error('Failed to call health error endpoint', error);
      createSnackbar('error', 'Failed to call health error endpoint');
    } finally {
      setHealthCheckLoading(false);
    }
  }

  return (
      <>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button variant="outlined" color="error" disableRipple
                  onClick={handleHealthError} disabled={healthCheckLoading}>
            {healthCheckLoading ? 'Calling health endpoint...' : 'Trigger health error'}
          </Button>
        </Box>
        <SnippetTable loading={isLoading} handleClickSnippet={setSnippetId} snippets={data?.snippets}
                      handleSearchSnippet={handleSearchSnippet}
                      filters={filters}
                      handleFilterChange={setFilters}
        />
        <Drawer open={!!snippetId} anchor={"right"} onClose={handleCloseModal}>
          {snippetId && <SnippetDetail handleCloseModal={handleCloseModal} id={snippetId}/>}
        </Drawer>
      </>
  )
}

export default withNavbar(HomeScreen);
