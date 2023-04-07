const { PermissionsBitField } = require('discord.js');

class WSPermissions {
    /**
     * Permission to play music, set volume, etc.
     */
    static get Play() {
        return 1n << 0n;
    }

    /**
     * Permission to upload and save music
     * 
     * This also allows downloading from streaming sites
     */
    static get Create() {
        return 1n << 1n;
    }

    /**
     * Permission to delete music
     */
    static get Delete() {
        return 1n << 2n;
    }

    /**
     * Permission to update music information
     */
    static get Edit() {
        return 1n << 3n;
    }

    /**
     * Administrator permission
     * 
     * If set allows access to everything
     */
    static get Administrator() {
        return 1n << 24n;
    }

    /**
     * All the permissions in one
     */
    static get All() {
        return this.Play | this.Create | this.Delete | this.Edit | this.Edit | this.Administrator;
    }

    static hasPermission(perms, check) {
        if(typeof perms != "bigint" || typeof check != "bigint")
            return false;
        return ((perms & this.Administrator) == this.Administrator) || ((perms & check) == check);
    }
}
module.exports = WSPermissions;