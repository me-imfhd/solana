use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{associated_token::AssociatedToken, token::Token};
use anchor_spl::{
    associated_token::{self},
    metadata::{self, create_master_edition_v3, CreateMasterEditionV3},
    token,
};
use mpl_token_metadata::state::Creator;
use mpl_token_metadata::state::DataV2;

declare_id!("HHuwFWf4EZsjEsp2CLBaGs3WReCtVb79pjZjLgP91XQC");

#[program]
pub mod collection {
    use super::*;

    pub fn create_mint_create_ata_mint_to_ata(
        ctx: Context<MintNFT>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
    ) -> Result<()> {
        msg!("Creating Mint Account and initailzing it");
        system_program::create_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                system_program::CreateAccount {
                    from: ctx.accounts.mint_authority.to_account_info(),
                    to: ctx.accounts.mint_account.to_account_info(),
                },
            ),
            100000000,
            100,
            &ctx.accounts.token_program.key(),
        )?; // create_accoutn returns result, add ? returns the data
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint_account.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            0,
            &ctx.accounts.mint_authority.key(),
            Some(&ctx.accounts.mint_authority.key()),
        )?;

        msg!("Create ATA");
        associated_token::create(CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            associated_token::Create {
                payer: ctx.accounts.mint_authority.to_account_info(),
                associated_token: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint_account.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ))?;

        msg!("Minting Token to ATA");
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint_account.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            1,
        )?;
        msg!("Creating Metadata Account and adding data");
        metadata::create_metadata_accounts_v3(
            CpiContext::new(
                ctx.accounts.token_metadata_program.to_account_info(),
                metadata::CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.mint_account.to_account_info(),
                    mint_authority: ctx.accounts.mint_authority.to_account_info(),
                    payer: ctx.accounts.mint_authority.to_account_info(),
                    update_authority: ctx.accounts.mint_authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            DataV2 {
                name,
                symbol,
                uri,
                seller_fee_basis_points,
                collection: None,
                creators: None,
                uses: None,
            },
            true,
            true,
            None,
        );
        msg!("Creating Master Edition Metadata Account");
        create_master_edition_v3(
            CpiContext::new(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMasterEditionV3 {
                    payer: ctx.accounts.mint_authority.to_account_info(),
                    edition: ctx
                        .accounts
                        .master_edition_metadata_account
                        .to_account_info(),
                    metadata: ctx.accounts.metadata_account.to_account_info(),
                    mint: ctx.accounts.mint_account.to_account_info(),
                    mint_authority: ctx.accounts.mint_authority.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    update_authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            Some(0),
        );
        msg!("Token Mint process completed successfully");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    /// CHECK: We're about to create this with Metaplex
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,
    /// CHECK: We're about to create this with Metaplex
    #[account(mut)]
    pub master_edition_metadata_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint_account: Signer<'info>, // create account, where payer / owner is creator of account -> Initialize as mint account
    /// CHECK: We're about to create this with Anchor
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>, // pda, will be derieved from mint_account and user wallet, here its same as Signer
    #[account(mut)]
    pub mint_authority: Signer<'info>, // wallet

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>, // like an env but its an wallet
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AnchorDataV2 {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
}
