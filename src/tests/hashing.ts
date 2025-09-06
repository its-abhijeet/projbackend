import { hash_password } from "../utils/cryptography";
import 'colorts/lib/string';

export const test1 = () =>{

    let raw = "aditya";
    let expected = "dtaaiy";

    let ans = hash_password(raw);

    if(ans===expected){
        console.log("good".green);
    }
    else{
        console.log("bad".red);
    }

    let raw2 = "";
    let expected2 = "";
    let ans2 = hash_password(raw2);
    if(ans2===expected2){
        console.log("good".underline.green);
    }
    else{
        console.log("bad".underline.red);
    }

    
    let raw3 = "wer";
    let expected3 = "ewr";
    let ans3 = hash_password(raw3);
    if(ans3===expected3){
        console.log("good".underline.green);
    }
    else{
        console.log("bad".underline.red);
    }
}