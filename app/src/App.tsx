import { useCallback, useEffect, useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk';
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'
import SafeAppsSDK from '@safe-global/safe-apps-sdk'
import './App.css'
import { Box, Button, Card, CardActions, CardContent, Collapse, IconButton, List, ListItem, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ethers } from 'ethers';
import { SafeResearchBanner, SafeResearchFooter } from './components/SafeResearch';

const GUARD_FACTORY_ADDRESS = "0xeEa957669eEe31aE47F294b346d1971c76318c5E"
const GUARD_STORAGE_SLOT = "0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8"

const CONTRACT_INTERFACE = new ethers.Interface([
  "function setGuard(address guard)",
  "function deploy(bytes32 salt, address expectedAddress)",
  "function setGuarantor(address guarantor)",
  "function getStorageAt(uint256 offset, uint256 length) public view returns (bytes memory)",
  "function guarantor() public view returns (address)",
  "function calculateAddress(bytes32 salt, address manager) public view returns (address predictedAddress)"
])

const call = async (sdk: SafeAppsSDK, address: string, method: string, params: any[]): Promise<any> => {
  const resp = await sdk.eth.call([{
    to: address,
    data: CONTRACT_INTERFACE.encodeFunctionData(method, params)
  }])
  return CONTRACT_INTERFACE.decodeFunctionResult(method, resp)[0];
}

interface CurrentSafeState {
  enabled: boolean,
  coSigner: string | null
}

function App() {
  const [currentState, setCurrentState] = useState<CurrentSafeState | undefined>()
  const [errorMsg, setErrorMsg] = useState("")
  const [guarantor, setGuarantor] = useState("")
  const [expanded, setExpanded] = useState(false);
  const { sdk, connected, safe } = useSafeAppsSDK();

  useEffect(() => {
    if (!connected) return
    const load = async () => {
      console.log("Load Info")
      try {
        const expectedGuard: string = await call(sdk, GUARD_FACTORY_ADDRESS, "calculateAddress", [ethers.ZeroHash, safe.safeAddress])
        const guard: string = ethers.getAddress("0x" + (await call(sdk, safe.safeAddress, "getStorageAt", [GUARD_STORAGE_SLOT, 1])).slice(26))
        setCurrentState({
          enabled: guard === expectedGuard,
          coSigner: ""
        })
        const coSigner: string = await call(sdk, expectedGuard, "guarantor", [])
        setCurrentState({
          enabled: guard === expectedGuard,
          coSigner
        })
      } catch (e) {
        console.log(e)
      }
    }
    load()
  }, [connected, sdk, safe, setErrorMsg]);

  const enableGuard = useCallback(async (coSigner: string) => {
    if (!connected) return
    try {
      if (!coSigner) throw Error("Co-Signer address is required");
      const coSignerAddress = ethers.getAddress(coSigner)
      console.log(coSignerAddress)
      const guardAddress: string = await call(sdk, GUARD_FACTORY_ADDRESS, "calculateAddress", [ethers.ZeroHash, safe.safeAddress])
      console.log({ guardAddress })
      const txs: BaseTransaction[] = [
        {
          to: GUARD_FACTORY_ADDRESS,
          value: "0",
          data: CONTRACT_INTERFACE.encodeFunctionData("deploy", [ethers.ZeroHash, guardAddress])
        },
        {
          to: safe.safeAddress,
          value: "0",
          data: CONTRACT_INTERFACE.encodeFunctionData("setGuard", [guardAddress])
        },
        {
          to: guardAddress,
          value: "0",
          data: CONTRACT_INTERFACE.encodeFunctionData("setGuarantor", [coSignerAddress])
        }
      ]
      sdk.txs.send({
        txs
      })
    } catch (e) {
      console.log(e)
      setErrorMsg(`${e}`)
    }
  }, [connected, sdk, safe, setErrorMsg]);

  return (
    <>
      <SafeResearchBanner />
      <h1>Varangian Guard</h1>
      <Box sx={{ textAlign: 'start', width: 600 }}>
        <p>define: Varangian Guard</p>
        <p>an elite unit of the Byzantine army from the tenth to the fourteenth century who served as personal bodyguards to the Byzantine emperors</p>
      </Box>
      {currentState && (
        <Card sx={{ display: "flex", flexDirection: "column", padding: "16px", textAlign: 'start' }}>
          <Typography><span style={{ color: currentState.enabled ? "green" : "red" }}>&#8226;</span> Co-Signer {currentState.enabled ? "enabled" : "disabled"}</Typography>
          <Typography>{currentState.coSigner}</Typography>
        </Card>
      )}
      {connected && (currentState?.enabled == true || (
        <Card sx={{ display: "flex", flexDirection: "column", padding: "16px", marginTop: "8px" }}>
          <TextField label={errorMsg || "Co-Signer Address"} onChange={(e) => {
            setErrorMsg("")
            setGuarantor(e.target.value)
          }} error={!!errorMsg}>{guarantor}</TextField>
          <Button
            sx={{ background: "#12ff80", color: "#001F26", border: "none", marginTop: "8px" }}
            onClick={() => enableGuard(guarantor)}>
            Setup Varangian Guard
          </Button>
        </Card>
      ))}
      {!connected && (
        <Card sx={{ display: "flex", flexDirection: "column", padding: "16px", marginTop: "8px" }}>
          This App has to be run as a Safe App in a compatible Safe Interface.
        </Card>
      )}
      <Card sx={{ padding: "4px 16px", marginTop: "8px", width: 600 }}>
        <CardActions disableSpacing>
          Instructions
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{ marginLeft: "auto" }}
            aria-label="show more"
          >
            <ExpandMoreIcon sx={{ transform: `rotate(${expanded ? 180 : 0}deg)` }} />
          </IconButton>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ textAlign: "start", padding: "8px" }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>Setup GitHub Action</Typography>
            <Typography sx={{ marginBottom: 2 }}>
              To setup the go to the <a href="https://github.com/safe-research/varangian-template" target="_blank">Varangian Template repository</a> and create a copy of it by selecting "Use this template" in the top right.
            </Typography>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>Setup GitHub Secrets</Typography>
            <Typography sx={{ marginBottom: 2 }}>
              For the GitHub action to work it is necessary to set the following secrets under "Settings" &gt; "Secrets and variables" &gt; "New repository secret":
              <List>
                <ListItem>
                  COSIGNER_MATERIAL - random string that is used to derive the Co-Signer private key
                </ListItem>
                <ListItem>
                  SAFE_ADDRESS - address of the Safe that should be monitored
                </ListItem>
                <ListItem>
                  SERVICE_URL - base url of the service that is used to submit transactions
                </ListItem>
              </List>
            </Typography>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>Retrieving Co-Signer Address</Typography>
            <Typography sx={{ marginBottom: 2 }}>
              To get the co-signer address it is necessary to run the GitHub action. Select "Actions" &gt; "Varangian Guard" (in the left sidebar) and click "Run workflow" (on the right side).
              <br /><br />
              Now you can select the "Varangian Guard" workflow run and there will be a job displayed called "fetch-check-relay". When clicking on it you can select the "Check Tx" step which prints the co-signer address.
            </Typography>
          </CardContent>
        </Collapse>
      </Card>
      <SafeResearchFooter repo='varangian' />
    </>
  )
}

export default App
