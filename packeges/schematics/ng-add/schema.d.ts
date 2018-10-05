export interface Schema {

    /**
    * The name of the electron-app.
    */
   name: string;

    /**
     * Name of related app.
     */
    relatedAppName?: string;

   /**
    * Skip installing dependency packages.
    */
   skipInstall?: boolean;
}
