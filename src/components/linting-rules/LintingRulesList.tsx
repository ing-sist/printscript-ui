import {useEffect, useState} from 'react';
import {
  Button,
  Card,
  Checkbox,
  List,
  ListItem,
  ListItemText, Select, MenuItem, FormControl, InputLabel,
  Typography
} from "@mui/material";
import {useGetLintingRules, useModifyLintingRules} from "../../utils/queries.tsx";
import {queryClient} from "../../queryClient.ts";
import {Rule} from "../../types/Rule.ts";

const LintingRulesList = () => {
  const [rules, setRules] = useState<Rule[] | undefined>([]);

  const {data, isLoading} = useGetLintingRules();
  const {mutateAsync, isLoading: isLoadingMutate} = useModifyLintingRules({
    onSuccess: () => queryClient.invalidateQueries('lintingRules')
  })

  useEffect(() => {
    setRules(data)
  }, [data]);

  const handleValueChange = (rule: Rule, newValue: string | number) => {
    const newRules = rules?.map(r => {
      if (r.name === rule.name) {
        return {...r, value: newValue}
      } else {
        return r;
      }
    })
    setRules(newRules)
  };

  const toggleRule = (rule: Rule) => () => {
    const newRules = rules?.map(r => {
      if (r.name === rule.name) {
        return {...r, isActive: !r.isActive}
      } else {
        return r;
      }
    })
    setRules(newRules)
  }

  return (
    <Card style={{padding: 16, margin: 16}}>
      <Typography variant={"h6"}>Linting rules</Typography>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {
          isLoading || isLoadingMutate ?  <Typography style={{height: 80}}>Loading...</Typography> :
          rules?.map((rule) => {
          return (
            <ListItem
              key={rule.name}
              disablePadding
              style={{height: 40}}
            >
              {rule.name !== "identifierNamingType" && (
                  <Checkbox
                      edge="start"
                      checked={rule.isActive}
                      disableRipple
                      onChange={toggleRule(rule)}
                  />
              )}
              <ListItemText primary={rule.name} />
              {rule.name === "identifierNamingType" ? (
                  <FormControl size="small">
                    <InputLabel>Naming</InputLabel>
                    <Select
                    label="Naming"
                        value={(rule.value as string) || "camel"}
                        onChange={(e) => handleValueChange(rule, e.target.value as string)}
                        sx={{minWidth: 140}}
                    >
                      <MenuItem value="camel">camelCase</MenuItem>
                      <MenuItem value="snake">snake_case</MenuItem>
                    </Select>
                  </FormControl>
              ) : null}
            </ListItem>
          )
        })}
      </List>
      <Button disabled={isLoading} variant={"contained"} onClick={() => mutateAsync(rules ?? [])}>Save</Button>
    </Card>

  );
};

export default LintingRulesList;
