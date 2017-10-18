pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';

contract PolyMathToken is Ownable, PausableToken, BurnableToken {

  // Token properties.
  string public constant name = 'PolyMathToken';
  string public constant symbol = 'POLY';
  // ERC20 compliant types
  // (see https://blog.zeppelin.solutions/tierion-network-token-audit-163850fd1787)
  uint8 public constant decimals = 18;
  // 1 billion POLY tokens in units divisible up to 18 decimals.
  uint256 public constant INITIAL_SUPPLY = 1000 * (10**6) * (10**uint256(decimals));
  address private crowdsale;

  modifier onlyCrowdsale() {
    require(crowdsale == msg.sender);
    _;
  }

  modifier crowdSaleNotStarted() {
    require(crowdsale == 0);
    _;
  }

  function PolyMathToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

  function setCrowdsaleAddress(address _crowdsale) onlyOwner crowdSaleNotStarted {
    crowdsale = _crowdsale;
    balances[owner] = 0;
    balances[crowdsale] = INITIAL_SUPPLY;
  }

  function issueTokensFrom(address _from, address _to, uint256 _value) onlyCrowdsale returns (bool) {
    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  // Don't accept calls to the contract address; must call a method.
  function () {
    revert();
  }

}
