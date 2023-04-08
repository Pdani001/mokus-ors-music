const WSPermissionBits = {
    /**
     * Permission to interact with the music player in general
     */
    Play:  1n << 0n,

    /**
     * Permission to save music and create folders
     */
    Create: 1n << 1n,

    /**
     * Permission to delete music and folders
     */
    Delete: 1n << 2n,

    /**
     * Permission to update music and folder information
     */
    Edit: 1n << 3n,

    /**
     * Permission to login to the web panel
     * 
     * This is ignored if the user has the {@link WSPermissions.Bits.Administrator} permission
     */
    Login: 1n << 4n,

    /**
     * Administrator permission
     * 
     * If set allows access to everything
     */
    Administrator: 1n << 24n
}
class WSPermissions {
    static readonly Bits = WSPermissionBits;
    /**
     * All the permissions in one
     */
    static get All() {
        let all = 0n;
        for(let flag in WSPermissionBits){
            all = all | WSPermissionBits[flag];
        }
        return all;
    }

    static has(permList: bigint, target: bigint, checkAdmin: boolean = true) {
        return (checkAdmin && (permList & WSPermissionBits.Administrator) == WSPermissionBits.Administrator) || ((permList & target) == target);
    }
}
export = WSPermissions;