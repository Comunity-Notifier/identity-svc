
import { Id } from '../value-objects/Id';
import { ProviderId } from '../value-objects/ProviderId';
import { Password } from '../value-objects/Password';
import { CreatedAt } from '../value-objects/CreatedAt';
import { UpdatedAt } from '../value-objects/UpdatedAt ';

export interface AccountProps {

    id: Id;
    userId: Id;
    accountId: Id;
    providerId: ProviderId;
    password?: Password;
    createdAt: CreatedAt;
    updatedAt: UpdatedAt;
}

export class Account {
    constructor(private readonly props: AccountProps) { }

    get id(): Id {
        return this.props.id;
    }

    get userId(): Id {
        return this.props.userId;
    }

    get accountId(): Id {
        return this.props.accountId;
    }

    get providerId(): ProviderId {
        return this.props.providerId;
    }

    get password(): Password | undefined {
        return this.props.password;
    }

    get createdAt(): CreatedAt {
        return this.props.createdAt;
    }

    get updatedAt(): UpdatedAt {
        return this.props.updatedAt;
    }
}
