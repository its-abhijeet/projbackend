export function hash_password(raw_password: string): string{
    let hashed_password = "";
    const n=raw_password.length;

    
        let h=1;
        for(let i=0;i<n;i++){
            hashed_password += raw_password[h%n];
            h+=2;
            if(h>=n)h=0;
        }

    return hashed_password
}