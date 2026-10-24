import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import readline from 'node:readline';
if(existsSync('.env')){console.log('Existing .env preserved.');process.exit(0);}
if(!process.stdin.isTTY){console.error('Run interactively to enter the initial administrator password.');process.exit(1);}
process.stdout.write('Initial Juradmin password (hidden, minimum 8 characters): ');
readline.emitKeypressEvents(process.stdin);process.stdin.setRawMode(true);process.stdin.resume();
let value='';
process.stdin.on('keypress',(s,key)=>{
 if(key?.ctrl&&key.name==='c')process.exit(130);
 if(key?.name==='backspace'){value=value.slice(0,-1);return;}
 if(key?.name==='return'){
  process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');
  if(value.length<8){console.error('Use at least 8 characters.');process.exit(1);}
  const salt=randomBytes(24).toString('hex'),hash=pbkdf2Sync(value,salt,100000,32,'sha256').toString('hex');
  writeFileSync('.env',`APP_URL=https://jura.consulting\nADMIN_PASSWORD_HASH=${hash}\nADMIN_PASSWORD_SALT=${salt}\nMAINTENANCE_TOKEN=${randomBytes(32).toString('hex')}\nRESEND_API_KEY=\nEMAIL_FROM=\n`,{mode:0o600,flag:'wx'});
  value='';console.log('Created .env with a password hash and generated maintenance credential.');process.exit(0);
 }
 if(s&&!key?.ctrl&&!key?.meta)value+=s;
});
