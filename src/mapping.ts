import { BigInt } from "@graphprotocol/graph-ts"
import {
  MonsterMaps,
  Approval,
  ApprovalForAll,
  OwnershipTransferred,
  Transfer
} from "../generated/MonsterMaps/MonsterMaps"

export function handleApproval(event: Approval): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.owner = event.params.owner
  entity.approved = event.params.approved

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.balanceOf(...)
  // - contract.getApproved(...)
  // - contract.getMonsterAtWaypoint(...)
  // - contract.getMonsterIds(...)
  // - contract.getWaypointCoord(...)
  // - contract.getWaypointCoords(...)
  // - contract.getWaypointCount(...)
  // - contract.isApprovedForAll(...)
  // - contract.name(...)
  // - contract.owner(...)
  // - contract.ownerOf(...)
  // - contract.supportsInterface(...)
  // - contract.symbol(...)
  // - contract.tokenByIndex(...)
  // - contract.tokenOfOwnerByIndex(...)
  // - contract.tokenURI(...)
  // - contract.totalSupply(...)
}

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId;
  let map = MonsterMaps.bind(event.address)
  let monsterIds = map.getMonsterIds(tokenId)

  

  let all = All.load('all');
  if (all == null) {
      all = new All('all');
      all.numOwners = BigInt.fromI32(0);
      all.numTokens = BigInt.fromI32(0);
      all.numTokenContracts = BigInt.fromI32(0);
  }
  


  let contract = EIP721.bind(event.address);
  let tokenContract = TokenContract.load(contractId);
  if(tokenContract == null) {
      // log.error('contract : {}',[event.address.toHexString()]);
      let supportsEIP165Identifier = supportsInterface(contract, '01ffc9a7');
      let supportsEIP721Identifier = supportsInterface(contract, '80ac58cd');
      let supportsNullIdentifierFalse = supportsInterface(contract, '00000000', false);
      let supportsEIP721 = supportsEIP165Identifier && supportsEIP721Identifier && supportsNullIdentifierFalse;

      let supportsEIP721Metadata = false;
      if(supportsEIP721) {
          supportsEIP721Metadata = supportsInterface(contract, '5b5e139f');
          // log.error('NEW CONTRACT eip721Metadata for {} : {}', [event.address.toHex(), supportsEIP721Metadata ? 'true' : 'false']);
      }
      if (supportsEIP721) {
          tokenContract = new TokenContract(contractId);
          tokenContract.doAllAddressesOwnTheirIdByDefault = false;
          tokenContract.supportsEIP721Metadata = supportsEIP721Metadata;
          tokenContract.numTokens = BigInt.fromI32(0);
          tokenContract.numOwners = BigInt.fromI32(0);
          let name = contract.try_name();
          if(!name.reverted) {
              tokenContract.name = normalize(name.value);
          }
          let symbol = contract.try_symbol();
          if(!symbol.reverted) {
              tokenContract.symbol = normalize(symbol.value);
          }
      } else {
          return;
      }
      all.numTokenContracts = all.numTokenContracts.plus(BigInt.fromI32(1));

      let doAllAddressesOwnTheirIdByDefault = contract.try_doAllAddressesOwnTheirIdByDefault();
      if(!doAllAddressesOwnTheirIdByDefault.reverted) {
          tokenContract.doAllAddressesOwnTheirIdByDefault = doAllAddressesOwnTheirIdByDefault.value; // only set it at creation
      } else {
          tokenContract.doAllAddressesOwnTheirIdByDefault = false;
      }
  }

  if (from != zeroAddress || to != zeroAddress) { // skip if from zero to zero

      if (from != zeroAddress) { // existing token
          let currentOwnerPerTokenContractId = contractId + '_' + from;
          let currentOwnerPerTokenContract = OwnerPerTokenContract.load(currentOwnerPerTokenContractId);
          if (currentOwnerPerTokenContract != null) {
              if (currentOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(1))) {
                  tokenContract.numOwners = tokenContract.numOwners.minus(BigInt.fromI32(1));
              }
              currentOwnerPerTokenContract.numTokens = currentOwnerPerTokenContract.numTokens.minus(BigInt.fromI32(1));
              currentOwnerPerTokenContract.save();
          }

          let currentOwner = Owner.load(from);
          if (currentOwner != null) {
              if (currentOwner.numTokens.equals(BigInt.fromI32(1))) {
                  all.numOwners = all.numOwners.minus(BigInt.fromI32(1));
              }
              currentOwner.numTokens = currentOwner.numTokens.minus(BigInt.fromI32(1));
              currentOwner.save();
          }
      } // else minting
      
      
      if(to != zeroAddress) { // transfer
          let newOwner = Owner.load(to);
          if (newOwner == null) {
              newOwner = new Owner(to);
              newOwner.numTokens = BigInt.fromI32(0);
          }

          let eip721Token = Token.load(id);
          if(eip721Token == null) {
              eip721Token = new Token(id);
              eip721Token.contract = tokenContract.id;
              eip721Token.tokenID = tokenId;
              eip721Token.mintTime = event.block.timestamp;
              if (tokenContract.supportsEIP721Metadata) {
                  let metadataURI = contract.try_tokenURI(tokenId);
                  if(!metadataURI.reverted) {
                      eip721Token.tokenURI = normalize(metadataURI.value);
                  } else {
                      eip721Token.tokenURI = "";
                  }
              } else {
                  // log.error('tokenURI not supported {}', [tokenContract.id]);
                  eip721Token.tokenURI = ""; // TODO null ?
              }
          }
          
          if (from == zeroAddress) { // mint +1
              all.numTokens = all.numTokens.plus(BigInt.fromI32(1));
          }
          
          eip721Token.owner = newOwner.id;
          eip721Token.save();

          if (newOwner.numTokens.equals(BigInt.fromI32(0))) {
              all.numOwners = all.numOwners.plus(BigInt.fromI32(1));
          }
          newOwner.numTokens = newOwner.numTokens.plus(BigInt.fromI32(1));
          newOwner.save();

          let newOwnerPerTokenContractId = contractId + '_' + to;
          let newOwnerPerTokenContract = OwnerPerTokenContract.load(newOwnerPerTokenContractId);
          if (newOwnerPerTokenContract == null) {
              newOwnerPerTokenContract = new OwnerPerTokenContract(newOwnerPerTokenContractId);
              newOwnerPerTokenContract.owner = newOwner.id;
              newOwnerPerTokenContract.contract = tokenContract.id;
              newOwnerPerTokenContract.numTokens = BigInt.fromI32(0);
          }

          if (newOwnerPerTokenContract.numTokens.equals(BigInt.fromI32(0))) {
              tokenContract.numOwners = tokenContract.numOwners.plus(BigInt.fromI32(1));
          }
          newOwnerPerTokenContract.numTokens = newOwnerPerTokenContract.numTokens.plus(BigInt.fromI32(1));
          newOwnerPerTokenContract.save();

          tokenContract.numTokens = tokenContract.numTokens.plus(BigInt.fromI32(1));
      } else { // burn
          store.remove('Token', id);
          all.numTokens = all.numTokens.minus(BigInt.fromI32(1));
          tokenContract.numTokens = tokenContract.numTokens.minus(BigInt.fromI32(1));
      }
  }
  tokenContract.save();
  all.save();
}
}
