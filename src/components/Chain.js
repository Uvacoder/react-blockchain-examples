import React, { useState, useEffect, useContext } from "react";
import sha256 from "crypto-js/sha256";
import { Grid, Button, ButtonGroup, TextField } from "@material-ui/core";
import { AlertContext } from "../providers/AlertProvider";
import Block from "./Block";

const calculateHash = blockData => sha256(JSON.stringify(blockData)).toString();

const getGenesisBlockData = () => ({
  index: -1,
  hash: ""
});

const getLatestBlock = blockchain =>
  blockchain.length ? blockchain[blockchain.length - 1] : getGenesisBlockData();

const mineBlock = (blockData, previousNonce = 0, difficulty = 0) => {
  let nonce = previousNonce;
  let hash = calculateHash(blockData);
  while (hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
    nonce++;
    hash = calculateHash({ ...blockData, nonce });
  }
  return { ...blockData, hash, nonce };
};

const addBlock = (blockchain, setBlockchain, difficulty) => {
  const {
    index: previousIndex,
    hash: previousHash,
    nonce: previousNonce
  } = getLatestBlock(blockchain);
  const index = previousIndex + 1;
  const timestamp = new Date().getTime();
  const blockData = {
    index,
    timestamp,
    previousHash
  };
  const minedBlock = mineBlock(blockData, previousNonce, difficulty);

  setBlockchain([...blockchain, minedBlock]);
};

const deleteBlock = (blockchain, setBlockchain) => index =>
  setBlockchain(blockchain.filter(block => block.index !== index));

const validate = (blockchainA, blockchainB) =>
  JSON.stringify(blockchainA) ===
  JSON.stringify(blockchainB.slice(0, blockchainA.length));

const editBlock = (blockchain, setBlockchain) => ({ hash, key, value }) =>
  setBlockchain(
    blockchain.map(block =>
      block.hash === hash ? { ...block, [key]: value } : block
    )
  );

const Chain = () => {
  const [blockchain, setBlockchain] = useState([]);
  const [localBlockchain, setLocalBlockchain] = useState([]);
  const [difficulty, setDifficulty] = useState(0);
  const setMessage = useContext(AlertContext);

  useEffect(() => {
    addBlock(blockchain, setBlockchain, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (blockchain.length > localBlockchain.length) {
      setLocalBlockchain(blockchain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockchain]);

  useEffect(() => {
    if (validate(blockchain, localBlockchain) && localBlockchain.length > 0) {
      setBlockchain(localBlockchain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBlockchain]);

  return (
    <Grid container>
      <Grid item md={6}>
        <Grid container>
          <Grid item flex="1">
            <ButtonGroup variant="contained" size="large">
              <Button
                color="primary"
                onClick={() =>
                  addBlock(localBlockchain, setLocalBlockchain, difficulty)
                }
              >
                Generate Block
              </Button>
              <Button
                color="primary"
                onClick={() =>
                  setMessage(
                    validate(blockchain, localBlockchain)
                      ? "Your local blockchain is in consensus with the majority of chains on the network."
                      : "Your local blockchain is not valid!"
                  )
                }
              >
                Validate
              </Button>
              <Button
                color="secondary"
                onClick={() => setLocalBlockchain(blockchain)}
              >
                Restore
              </Button>
            </ButtonGroup>
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              label="Difficulty level (0–5)"
              type="number"
              value={difficulty}
              margin="none"
              onChange={e =>
                Number(e.target.value) >= 0 &&
                setDifficulty(e.target.value > 4 ? 5 : Number(e.target.value))
              }
            />
          </Grid>
        </Grid>
        {localBlockchain.map((blockData, index) => (
          <Block
            key={index}
            index={index}
            del={deleteBlock(localBlockchain, setLocalBlockchain)}
            onChange={editBlock(localBlockchain, setLocalBlockchain)}
            {...blockData}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default Chain;
